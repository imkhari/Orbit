import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { EnergyLevel, RescueTaskResponse, Task } from '../types';
import { TaskService } from '../services/api';

interface RescueModalProps {
  visible: boolean;
  onClose: () => void;
  onStartFocus: (task: Task) => void;
  currentEnergy?: EnergyLevel;
  activeBoardId?: string | null;
}

export const RescueModal: React.FC<RescueModalProps> = ({
  visible,
  onClose,
  onStartFocus,
  currentEnergy = 'MEDIUM',
  activeBoardId,
}) => {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>(currentEnergy);
  const [availableMinutes, setAvailableMinutes] = useState<number>(25);
  const [rescueData, setRescueData] = useState<RescueTaskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedEnergy(currentEnergy);
      fetchRecommendation(currentEnergy, availableMinutes);
    }
  }, [visible, currentEnergy]);

  const fetchRecommendation = async (energy: EnergyLevel, minutes: number) => {
    setIsLoading(true);
    setError(null);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const data = await TaskService.getRescueRecommendation({
        boardId: activeBoardId || undefined,
        currentEnergy: energy,
        availableMinutes: minutes,
      });
      setRescueData(data);
    } catch (err: any) {
      console.warn('Rescue recommendation error:', err);
      setError('Chưa tìm thấy nhiệm vụ phù hợp trong bảng. Hãy thêm một vài việc nhẹ nhàng nhé!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnergyChange = (energy: EnergyLevel) => {
    setSelectedEnergy(energy);
    fetchRecommendation(energy, availableMinutes);
  };

  const handleMinutesChange = (minutes: number) => {
    setAvailableMinutes(minutes);
    fetchRecommendation(selectedEnergy, minutes);
  };

  const handleStartAction = () => {
    if (!rescueData?.task) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const t: Task = {
      id: rescueData.task.id,
      boardId: rescueData.task.boardId || 'board-main',
      title: rescueData.task.title,
      description: rescueData.task.description,
      status: rescueData.task.status,
      urgency: rescueData.task.urgency,
      energyRequired: rescueData.task.energyRequired,
      estimatedMinutes: rescueData.task.estimatedMinutes,
      deadline: rescueData.task.deadline,
      position: rescueData.task.position ?? 0,
      subtasks: (rescueData.task.subtasks || []).map((s) => ({
        id: s.id,
        taskId: s.taskId || rescueData.task.id,
        title: s.title,
        estimatedMinutes: s.estimatedMinutes ?? 15,
        energyLevel: s.energyLevel ?? 'LOW',
        stepOrder: s.stepOrder ?? 1,
        isCompleted: Boolean(s.isCompleted),
        completedAt: s.completedAt,
      })),
      createdAt: rescueData.task.createdAt,
      completedAt: rescueData.task.completedAt,
    };
    onClose();
    onStartFocus(t);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.magicIcon}>✨</Text>
              <Text style={styles.title}>Cứu Tê Liệt Não (Magic Pick)</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Đóng modal cứu tê liệt não"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Bạn đang bị ngợp trước danh sách công việc? Thuật toán P(T) sẽ chọn giúp bạn duy nhất 1 việc vừa sức nhất ngay lúc này.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Bộ chọn năng lượng nhanh */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>Năng lượng hiện tại của bạn:</Text>
              <View style={styles.chipsRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as EnergyLevel[]).map((level) => {
                  const isSelected = selectedEnergy === level;
                  const label =
                    level === 'LOW' ? '☕ Kiệt sức' : level === 'HIGH' ? '🔥 Sung mãn' : '⚡ Vừa sức';
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleEnergyChange(level)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bộ chọn thời gian rảnh */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>Thời gian bạn có thể dành ra:</Text>
              <View style={styles.chipsRow}>
                {[15, 25, 45].map((mins) => {
                  const isSelected = availableMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleMinutesChange(mins)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        ⏱️ {mins} phút
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Nội dung đề xuất */}
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.loadingText}>Đang quét và tính điểm P(T) thích ứng...</Text>
              </View>
            ) : error ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🌿</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : rescueData?.task ? (
              <View style={styles.recommendationCard}>
                {/* Score & Match badge */}
                <View style={styles.badgeRow}>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>
                      Điểm phù hợp: {rescueData.priorityScore || 95}/100
                    </Text>
                  </View>
                  <View style={styles.energyBadge}>
                    <Text style={styles.energyBadgeText}>
                      {rescueData.task.energyRequired === 'LOW'
                        ? '☕ Nhẹ nhàng'
                        : rescueData.task.energyRequired === 'HIGH'
                        ? '🔥 Cao'
                        : '⚡ Vừa'}
                    </Text>
                  </View>
                </View>

                {/* Tiêu đề nhiệm vụ */}
                <Text style={styles.taskTitle}>{rescueData.task.title}</Text>
                {Boolean(rescueData.task.description) && (
                  <Text style={styles.taskDesc} numberOfLines={2}>
                    {rescueData.task.description}
                  </Text>
                )}

                {/* Khung vi bước khởi động < 5 phút */}
                {Boolean(rescueData.starterSubtask) && (
                  <View style={styles.starterBox}>
                    <View style={styles.starterHeader}>
                      <Text style={styles.starterIcon}>🎯</Text>
                      <Text style={styles.starterLabel}>
                        Vi bước khởi động ({rescueData.starterSubtask?.estimatedMinutes || 3} phút):
                      </Text>
                    </View>
                    <Text style={styles.starterTitle}>
                      {rescueData.starterSubtask?.title}
                    </Text>
                  </View>
                )}

                {/* Lời giải thích & tâm lý dịu dàng */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonIcon}>💡</Text>
                  <Text style={styles.reasonText}>{rescueData.whyRecommended}</Text>
                </View>

                <View style={styles.encouragementBox}>
                  <Text style={styles.encouragementText}>
                    {rescueData.gentleEncouragement}
                  </Text>
                </View>

                {/* Nút bắt đầu ngay */}
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartAction}
                  activeOpacity={0.8}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Bắt đầu ngay nhiệm vụ này"
                >
                  <Text style={styles.startButtonText}>🚀 Bắt Đầu Ngay (Chuyển sang Focus)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>
                  Bạn đã hoàn thành hết các nhiệm vụ đang chờ! Hãy nghỉ ngơi hoặc thêm việc mới nhé.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38BDF8',
    padding: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  magicIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  filterSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  chipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#38BDF8',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  energyBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  energyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FBBF24',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  starterBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  starterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  starterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    textTransform: 'uppercase',
  },
  starterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  reasonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  reasonText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
  },
  encouragementBox: {
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 12,
    color: '#38BDF8',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  startButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
