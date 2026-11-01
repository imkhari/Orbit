import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, EnergyLevel, Subtask, AIDecomposeResponse } from '../types';
import { TaskService } from '../services/api';

interface ProposedStep {
  id: string;
  stepOrder: number;
  title: string;
  estimatedMinutes: number;
  energyLevel: EnergyLevel;
  isSelected: boolean;
  isRecommendedStarter?: boolean;
}

interface AIDecomposeModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onApplySubtasks: (taskId: string, subtasks: Subtask[]) => void;
}

export const AIDecomposeModal: React.FC<AIDecomposeModalProps> = ({
  visible,
  task,
  onClose,
  onApplySubtasks,
}) => {
  const [steps, setSteps] = useState<ProposedStep[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [reasoningSummary, setReasoningSummary] = useState<string | null>(null);

  // Hiệu ứng thở nhịp nhàng (breathing pulse) 1.2s giúp xoa dịu lo âu giác quan ADHD
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (isLoading) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [isLoading, pulseAnim]);

  // Tự động gọi API AI decompose khi modal mở ra
  useEffect(() => {
    if (!visible || !task) {
      setSteps([]);
      setIsLoading(false);
      setIsApplying(false);
      setIsFallback(false);
      setReasoningSummary(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsFallback(false);
    setReasoningSummary(null);

    const fetchDecomposition = async () => {
      try {
        const response: AIDecomposeResponse = await TaskService.decomposeWithAI(task.id);
        if (!isMounted) return;

        const subtasks = response.suggestedSubtasks || [];
        const mappedSteps: ProposedStep[] = subtasks.map((s, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          stepOrder: s.stepOrder ?? idx + 1,
          title: s.title,
          estimatedMinutes: s.estimatedMinutes ?? (idx === 0 ? 5 : 15),
          energyLevel: s.energyLevel ?? (idx === 0 ? 'LOW' : 'MEDIUM'),
          isSelected: true,
          isRecommendedStarter: s.isRecommendedStarter ?? (idx === 0),
        }));

        setSteps(mappedSteps);
        setIsFallback(Boolean(response.isFallback));
        if (response.reasoningSummary) {
          setReasoningSummary(response.reasoningSummary);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('AI Decompose API error, kích hoạt Offline Heuristic Fallback:', err?.message);

        // Heuristic Fallback Engine tuân thủ 4 quy tắc vàng nhận thức ADHD
        // Bước 1 < 5 phút, các bước tiếp theo <= 20 phút
        const fallbackSteps: ProposedStep[] = [
          {
            id: `fallback-1-${Date.now()}`,
            stepOrder: 1,
            title: `Mở tài liệu và viết dàn ý 3 ý chính cho "${task.title}"`,
            estimatedMinutes: 5,
            energyLevel: 'LOW',
            isSelected: true,
            isRecommendedStarter: true,
          },
          {
            id: `fallback-2-${Date.now()}`,
            stepOrder: 2,
            title: 'Thu thập thông tin & tài liệu tham khảo cần thiết',
            estimatedMinutes: 15,
            energyLevel: 'MEDIUM',
            isSelected: true,
          },
          {
            id: `fallback-3-${Date.now()}`,
            stepOrder: 3,
            title: 'Thực hiện phần cốt lõi đầu tiên (bản nháp 1)',
            estimatedMinutes: 20,
            energyLevel: 'HIGH',
            isSelected: true,
          },
          {
            id: `fallback-4-${Date.now()}`,
            stepOrder: 4,
            title: 'Kiểm tra lại kết quả và định dạng hoàn chỉnh',
            estimatedMinutes: 10,
            energyLevel: 'LOW',
            isSelected: true,
          },
        ];

        setSteps(fallbackSteps);
        setIsFallback(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDecomposition();

    return () => {
      isMounted = false;
    };
  }, [visible, task]);

  const toggleSelect = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, isSelected: !step.isSelected } : step
      )
    );
  };

  const updateTitle = (id: string, newTitle: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, title: newTitle } : step))
    );
  };

  const handleApply = async () => {
    if (!task || isApplying) return;
    const selected = steps.filter((s) => s.isSelected);
    if (selected.length === 0) return;

    setIsApplying(true);

    // Haptic feedback: Medium impact gives feeling of micro-accomplishment
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const formattedSubtasks: Subtask[] = selected.map((s, idx) => ({
      id: s.id,
      taskId: task.id,
      title: s.title.trim(),
      estimatedMinutes: s.estimatedMinutes,
      energyLevel: s.energyLevel,
      stepOrder: idx + 1,
      isCompleted: false,
    }));

    try {
      await onApplySubtasks(task.id, formattedSubtasks);
    } finally {
      setIsApplying(false);
      onClose();
    }
  };

  const selectedCount = steps.filter((s) => s.isSelected).length;
  const totalMinutes = steps
    .filter((s) => s.isSelected)
    .reduce((acc, curr) => acc + curr.estimatedMinutes, 0);

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Pull handle indicator */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>✨ HUMAN-IN-THE-LOOP AI BREAKDOWN</Text>
              {isFallback && (
                <View style={styles.fallbackPill}>
                  <Text style={styles.fallbackPillText}>🛡️ Heuristic Fallback</Text>
                </View>
              )}
            </View>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={styles.instruction}>
              AI đã phân rã nhiệm vụ thành các bước ≤ 20 phút (bước 1 ≤ 5 phút khởi động). Bạn có thể chỉnh sửa trực tiếp hoặc bỏ chọn trước khi áp dụng:
            </Text>
            {reasoningSummary ? (
              <Text style={styles.reasoningText}>💡 {reasoningSummary}</Text>
            ) : null}
          </View>

          {/* Shimmer / Skeleton Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3, 4].map((item) => (
                <Animated.View
                  key={item}
                  style={[styles.skeletonStepRow, { opacity: pulseAnim }]}
                >
                  <View style={styles.skeletonCheckbox} />
                  <View style={styles.skeletonContent}>
                    <View
                      style={[
                        styles.skeletonTitleBar,
                        { width: item === 1 ? '70%' : item === 2 ? '85%' : '60%' },
                      ]}
                    />
                    <View style={styles.skeletonMetaBar} />
                  </View>
                </Animated.View>
              ))}

              <View style={styles.loadingMessageContainer}>
                <Text style={styles.loadingMessageIcon}>🌌</Text>
                <Text style={styles.loadingMessageTitle}>
                  Orbit AI đang suy nghĩ và bẻ nhỏ công việc...
                </Text>
                <Text style={styles.loadingMessageSubtitle}>
                  Bước đầu tiên sẽ luôn là bước mồi nhẹ nhàng dưới 5 phút để bạn dễ dàng bắt đầu!
                </Text>
              </View>
            </View>
          ) : (
            /* Steps List */
            <ScrollView style={styles.stepList} showsVerticalScrollIndicator={false}>
              {steps.map((step) => (
                <View
                  key={step.id}
                  style={[
                    styles.stepRow,
                    !step.isSelected && styles.stepRowDeselected,
                    step.isRecommendedStarter && styles.stepRowStarter,
                  ]}
                >
                  {/* Checkbox with hitSlop to ensure >= 44x44pt bounding box */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      step.isSelected && styles.checkboxChecked,
                    ]}
                    onPress={() => toggleSelect(step.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {step.isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>

                  {/* Title input field (Editable) */}
                  <View style={styles.titleInputWrapper}>
                    <TextInput
                      style={[
                        styles.stepInput,
                        !step.isSelected && styles.stepInputDeselected,
                      ]}
                      value={step.title}
                      onChangeText={(val) => updateTitle(step.id, val)}
                      placeholder="Tiêu đề vi bước..."
                      placeholderTextColor="#64748B"
                    />
                    <View style={styles.stepMetaRow}>
                      {step.isRecommendedStarter && (
                        <View style={styles.starterBadge}>
                          <Text style={styles.starterBadgeText}>
                            🌱 Khởi động ≤ 5m
                          </Text>
                        </View>
                      )}
                      <Text style={styles.stepTimeBadge}>
                        ⏱️ {step.estimatedMinutes} phút
                      </Text>
                      <Text style={styles.stepEnergyBadge}>
                        {step.energyLevel === 'LOW'
                          ? '☕ Nhẹ nhàng'
                          : step.energyLevel === 'MEDIUM'
                          ? '⚡ Vừa sức'
                          : '🔥 Sâu'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Focus Summary */}
          {!isLoading && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                Tổng thời gian: <Text style={styles.bold}>{totalMinutes} phút</Text>{' '}
                ({selectedCount} bước được chọn)
              </Text>
            </View>
          )}

          {/* Action buttons with minHeight >= 48pt */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (selectedCount === 0 || isLoading || isApplying) &&
                  styles.confirmBtnDisabled,
              ]}
              onPress={handleApply}
              disabled={selectedCount === 0 || isLoading || isApplying}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                {isApplying
                  ? 'Đang áp dụng...'
                  : `Áp dụng (${selectedCount}) vi bước`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: '#475569',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  fallbackPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  fallbackPillText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    lineHeight: 24,
  },
  instruction: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  reasoningText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 6,
    fontStyle: 'italic',
  },
  stepList: {
    maxHeight: 330,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepRowStarter: {
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  stepRowDeselected: {
    opacity: 0.45,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  checkmark: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  titleInputWrapper: {
    flex: 1,
  },
  stepInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    paddingVertical: 2,
    marginBottom: 6,
    minHeight: 28,
  },
  stepInputDeselected: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  starterBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starterBadgeText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
  },
  stepTimeBadge: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  stepEnergyBadge: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '600',
  },
  summaryBar: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  bold: {
    fontWeight: '700',
    color: '#38BDF8',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    minHeight: 48, // WCAG 2.1 AA touch-target >= 44x44 pt
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#38BDF8',
    minHeight: 48, // WCAG 2.1 AA touch-target >= 44x44 pt
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 10,
    gap: 10,
  },
  skeletonStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  skeletonCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#334155',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitleBar: {
    height: 14,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  skeletonMetaBar: {
    width: 90,
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 3,
  },
  loadingMessageContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  loadingMessageIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  loadingMessageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
  },
  loadingMessageSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
