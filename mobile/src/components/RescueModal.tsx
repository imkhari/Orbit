import { ActionButton, ScreenHeader } from '../ui/Controls';
import { colors } from '../ui/theme';
import { useLocale } from '../ui/locale';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { EnergyLevel, RescueTaskResponse, Subtask } from '../types';
import { TaskService } from '../services/api';

interface RescueModalProps {
  visible: boolean;
  onClose: () => void;
  onStartFocus: (taskId: string, step?: Subtask) => Promise<boolean>;
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
  const t = useLocale();
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>(currentEnergy);
  const [availableMinutes, setAvailableMinutes] = useState<number>(25);
  const [rescueData, setRescueData] = useState<RescueTaskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const requestId = useRef(0);
  const starting = useRef(false);

  useEffect(() => {
    if (visible) {
      setSelectedEnergy(currentEnergy);
      setRescueData(null);
      void fetchRecommendation(currentEnergy, availableMinutes);
    }
    return () => { requestId.current += 1; };
  }, [visible, currentEnergy, activeBoardId]);

  const fetchRecommendation = async (energy: EnergyLevel, minutes: number) => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    setStartError(null);
    try {
      const boardId = activeBoardId && /^[a-f0-9-]{36}$/i.test(activeBoardId) ? activeBoardId : undefined;
      const data = await TaskService.getRescueRecommendation({
        boardId,
        currentEnergy: energy,
        availableMinutes: minutes,
      });
      if (requestId.current === id) setRescueData(data);
    } catch {
      if (requestId.current === id) setError(t("Chưa tải được gợi ý. Bạn có thể thử lại.", "Could not load a suggestion. Try again."));
    } finally {
      if (requestId.current === id) setIsLoading(false);
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

  const starterTitle = rescueData?.starterSubtask?.id ? rescueData.starterSubtask.title
    : t('Chuẩn bị thứ đầu tiên bạn cần để bắt đầu việc này', 'Get the first thing you need to start');

  const handleStartAction = async () => {
    if (!rescueData?.task || starting.current) return;
    starting.current = true;
    setIsStarting(true);
    setStartError(null);
    const { task, starterSubtask } = rescueData;
    const step: Subtask | undefined = starterSubtask ? {
      ...starterSubtask,
      title: starterTitle,
      taskId: task.id,
      id: starterSubtask.id ?? '',
      isCompleted: false,
    } : undefined;

    try {
      if (await onStartFocus(task.id, step)) onClose();
      else setStartError(t("Chưa bắt đầu được việc này. Bạn có thể thử lại hoặc quay về bảng.", "Could not start this task. Try again or return to the board."));
    } finally {
      starting.current = false;
      setIsStarting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!starting.current) onClose(); }}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScreenHeader title={t('Một việc vừa sức', 'A manageable task')}
            onClose={() => { if (!starting.current) onClose(); }} />

          <Text style={styles.subtitle}>{t("Orbit gợi ý một việc theo năng lượng và thời gian bạn có.", "Orbit suggests a task based on your energy and time.")}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Bộ chọn năng lượng nhanh */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionLabel}>{t("Năng lượng hiện tại của bạn:", "Your current energy")}</Text>
              <View style={styles.chipsRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as EnergyLevel[]).map((level) => {
                  const isSelected = selectedEnergy === level;
                  const label =
                    level === 'LOW' ? t('Thấp') : level === 'HIGH' ? t('Cao') : t('Vừa');
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleEnergyChange(level)}
                      disabled={isStarting}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
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
              <Text style={styles.sectionLabel}>{t("Thời gian bạn có thể dành ra:", "Time you have available")}</Text>
              <View style={styles.chipsRow}>
                {[15, 25, 45].map((mins) => {
                  const isSelected = availableMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleMinutesChange(mins)}
                      disabled={isStarting}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {t(`${mins} phút`, `${mins} min`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Nội dung đề xuất */}
            {isLoading ? (
              <View style={styles.loadingBox}>
                <View style={styles.skeleton} accessibilityElementsHidden />
                <Text style={styles.loadingText} accessibilityLiveRegion="polite">{t("Đang tìm một việc vừa sức…", "Finding a manageable task…")}</Text>
              </View>
            ) : error ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{error}</Text>
                <ActionButton label={t('Thử lại')} onPress={() => void fetchRecommendation(selectedEnergy, availableMinutes)} />
              </View>
            ) : rescueData?.task ? (
              <View style={styles.recommendationCard}>
                {/* Score & Match badge */}
                <View style={styles.badgeRow}>
                  <View style={styles.energyBadge}>
                    <Text style={styles.energyBadgeText}>
                      {rescueData.task.energyRequired === 'LOW'
                        ? t('Thấp')
                        : rescueData.task.energyRequired === 'HIGH'
                        ? t('Cao')
                        : t('Vừa')}
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
                      <Text style={styles.starterLabel}>
                        {t(`Bước đầu tiên · ${rescueData.starterSubtask?.estimatedMinutes || 3} phút`, `First step · ${rescueData.starterSubtask?.estimatedMinutes || 3} min`)}
                      </Text>
                    </View>
                    <Text style={styles.starterTitle}>
                      {starterTitle}
                    </Text>
                  </View>
                )}

                {startError && <Text style={styles.emptyText} accessibilityLiveRegion="polite">{startError}</Text>}

                {/* Nút bắt đầu ngay */}
                <ActionButton label={isStarting ? t('Đang lưu…', 'Saving…')
                  : rescueData.starterSubtask ? t('Bắt đầu bước này') : t('Bắt đầu việc này', 'Start this task')}
                  disabled={isStarting} onPress={() => void handleStartAction()} />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t("Chưa có việc để gợi ý. Bạn có thể thêm một việc trên bảng.", "No tasks to suggest. Capture a task on the board.")}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
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
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skeleton: { width: '100%', height: 40, borderRadius: 10, backgroundColor: colors.border },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.accent,
  },
  emptyBox: {
    padding: 12,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: colors.canvas,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    color: colors.warning,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 13,
    color: colors.muted,
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
  starterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  starterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
