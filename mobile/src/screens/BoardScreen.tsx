import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, TaskStatus, EnergyLevel, Subtask } from '../types';
import { StreakState } from '../store/useTaskStore';
import { TaskCard } from '../components/TaskCard';
import { QuickCaptureBar } from '../components/QuickCaptureBar';
import { AIDecomposeModal } from '../components/AIDecomposeModal';
import {
  EnergyFilterWidget,
  EnergyFilterType,
} from '../components/EnergyFilterWidget';

export interface BoardScreenProps {
  tasks: Task[];
  streak?: StreakState;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void | Promise<boolean> | boolean;
  onQuickAdd: (title: string, energy: EnergyLevel) => void;
  onApplySubtasks: (taskId: string, newSubtasks: Subtask[]) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onNavigateFocus?: () => void;
  onFocusTask?: (task: Task) => void;
  rollbackTaskId?: string | null;
  isLoading?: boolean;
}

export const BoardScreen: React.FC<BoardScreenProps> = ({
  tasks,
  streak = {
    currentStreak: 5,
    longestStreak: 5,
    freezeCredits: 2,
    streakState: 'ACTIVE',
    totalXp: 150,
    currentLevel: 1,
    isFrozenToday: false,
    gentleMessage: 'Mỗi bước nhỏ đều tạo nên bước nhảy lớn 🌿',
  },
  onMoveTask,
  onQuickAdd,
  onApplySubtasks,
  onToggleSubtask,
  onNavigateFocus,
  onFocusTask,
  rollbackTaskId: propRollbackTaskId,
  isLoading,
}) => {
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('TODO');
  const [decomposingTask, setDecomposingTask] = useState<Task | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyFilterType>('ALL');
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false);

  // Task movement with WIP=1 Spring Physics & Haptics delegation to useTaskStore
  const handleTaskMovement = (taskId: string, targetStatus: TaskStatus) => {
    if (targetStatus === 'TODO') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    onMoveTask(taskId, targetStatus);
  };

  // Quick Capture wraps parent callback and switches to BACKLOG column
  const handleQuickAdd = (title: string, energy: EnergyLevel) => {
    onQuickAdd(title, energy);
    setActiveColumn('BACKLOG');
  };

  const handleFocusTaskAction = (task: Task) => {
    if (onFocusTask) {
      onFocusTask(task);
    } else if (onNavigateFocus) {
      onNavigateFocus();
    }
  };

  const handleOpenStreakModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowStreakModal(true);
  };

  // Column definitions
  const columns: Array<{ status: TaskStatus; label: string; count: number }> = [
    {
      status: 'BACKLOG',
      label: 'Backlog',
      count: tasks.filter((t) => t.status === 'BACKLOG').length,
    },
    {
      status: 'TODO',
      label: 'Cần làm',
      count: tasks.filter((t) => t.status === 'TODO').length,
    },
    {
      status: 'DOING',
      label: 'Đang làm (1/1)',
      count: tasks.filter((t) => t.status === 'DOING').length,
    },
    {
      status: 'DONE',
      label: 'Đã xong',
      count: tasks.filter((t) => t.status === 'DONE').length,
    },
  ];

  // Dynamic Re-ranking & Dimming based on Energy Filter
  const displayedTasks = useMemo(() => {
    const columnTasks = tasks.filter((t) => t.status === activeColumn);

    if (selectedEnergy === 'ALL') {
      return columnTasks.map((t) => ({ task: t, isDimmed: false }));
    }

    const matched = columnTasks.filter((t) => t.energyRequired === selectedEnergy);
    const unmatched = columnTasks.filter((t) => t.energyRequired !== selectedEnergy);

    return [
      ...matched.map((t) => ({ task: t, isDimmed: false })),
      ...unmatched.map((t) => ({ task: t, isDimmed: true })),
    ];
  }, [tasks, activeColumn, selectedEnergy]);

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header with Streak Shield Widget */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>🌌 Orbit</Text>
            {isLoading && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>Đang đồng bộ...</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            Điều phối công việc cho tâm trí ADHD
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Header Streak & Shield Widget (minHeight >= 44pt touch-target) */}
          <TouchableOpacity
            style={styles.streakHeaderWidget}
            onPress={handleOpenStreakModal}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.streakBadgeItem}>
              <Text style={styles.streakFireText}>🔥 {streak.currentStreak} ngày</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.freezeBadgeItem}>
              <Text style={styles.freezeShieldText}>🛡️ {streak.freezeCredits} Khiên</Text>
            </View>
          </TouchableOpacity>

          {onNavigateFocus && (
            <TouchableOpacity
              style={styles.focusHeaderBtn}
              onPress={onNavigateFocus}
              activeOpacity={0.8}
            >
              <Text style={styles.focusHeaderBtnText}>🎯 Focus</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Gentle Tooltip/Modal for Streak Freeze Shield */}
      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalShieldIcon}>🛡️</Text>
              <Text style={styles.modalTitle}>KHIÊN ĐÓNG BĂNG & CHUỖI NGÀY</Text>
            </View>

            <Text style={styles.modalEmpatheticMessage}>
              "Khiên Đóng Băng sẽ tự động tha thứ và bảo vệ chuỗi ngày nếu hôm nay bạn bận việc hoặc cần nghỉ ngơi. Không áp lực, hãy làm khi bạn sẵn sàng! 🌿"
            </Text>

            <View style={styles.modalStatsGrid}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValueFire}>🔥 {streak.currentStreak} ngày</Text>
                <Text style={styles.modalStatLabel}>Chuỗi tập trung liên tiếp</Text>
              </View>

              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValueShield}>🛡️ {streak.freezeCredits} Khiên</Text>
                <Text style={styles.modalStatLabel}>Lá chắn bảo lưu sẵn sàng</Text>
              </View>
            </View>

            <View style={styles.modalXpRow}>
              <Text style={styles.modalXpText}>
                ⭐ <Text style={styles.modalBoldText}>{streak.totalXp} XP</Text> • Cấp độ {streak.currentLevel}
              </Text>
              <Text style={styles.modalTipText}>
                🌱 Cứ mỗi 3 ngày hoàn thành nhiệm vụ liên tục, bạn được nhận thêm 1 Khiên Bảo Vệ (tối đa 2 khiên).
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowStreakModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Đã hiểu 🌿</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Energy Quick-Filter Widget */}
      <EnergyFilterWidget
        selectedEnergy={selectedEnergy}
        onSelectEnergy={(energy) => setSelectedEnergy(energy)}
        streakDays={streak.currentStreak}
        freezeCount={streak.freezeCredits}
        showStreakCard={false}
      />

      {/* Column Tabs */}
      <View style={styles.columnTabBar}>
        {columns.map((col) => {
          const isActive = activeColumn === col.status;
          return (
            <TouchableOpacity
              key={col.status}
              style={[styles.columnTab, isActive && styles.columnTabActive]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveColumn(col.status);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.columnTabText,
                  isActive && styles.columnTabTextActive,
                ]}
              >
                {col.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isActive && styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    isActive && styles.countBadgeTextActive,
                  ]}
                >
                  {col.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task Cards List with Energy-based Rerank, Dimming and Subtask check-off */}
      <ScrollView
        style={styles.taskListContainer}
        contentContainerStyle={styles.taskListContent}
      >
        {selectedEnergy !== 'ALL' && (
          <View style={styles.filterHintBanner}>
            <Text style={styles.filterHintText}>
              💡 Đang ưu tiên việc{' '}
              {selectedEnergy === 'LOW'
                ? '☕ Thấp'
                : selectedEnergy === 'MEDIUM'
                ? '⚡ Vừa'
                : '🔥 Cao'}
              . Các việc nặng hơn được xếp dưới và làm mờ để giảm tải nhận thức.
            </Text>
          </View>
        )}

        {displayedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeColumn === 'DOING'
                ? '🎯'
                : activeColumn === 'DONE'
                ? '✨'
                : '☕'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeColumn === 'DOING'
                ? 'Chưa có việc nào đang làm'
                : activeColumn === 'DONE'
                ? 'Chưa có việc nào hoàn thành hôm nay'
                : 'Đầu óc bạn đang thảnh thơi!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeColumn === 'DOING'
                ? 'Hãy chọn 1 việc vừa sức nhất trong cột "Cần làm" để bắt đầu nhẹ nhàng nhé!'
                : activeColumn === 'DONE'
                ? 'Mỗi bước nhỏ đều đưa bạn đến gần đích hơn.'
                : 'Nếu có ý nghĩ nào nảy ra, hãy thêm nhanh ở thanh dưới đáy. Orbit sẽ giữ hộ bạn.'}
            </Text>
          </View>
        ) : (
          displayedTasks.map(({ task, isDimmed }) => (
            <TaskCard
              key={task.id}
              task={task}
              onMoveTask={handleTaskMovement}
              onOpenAIDecompose={(t) => setDecomposingTask(t)}
              onFocusTask={handleFocusTaskAction}
              onToggleSubtask={onToggleSubtask}
              isDimmed={isDimmed}
              triggerRollback={propRollbackTaskId === task.id}
            />
          ))
        )}
      </ScrollView>

      {/* Bottom Quick Capture Bar */}
      <QuickCaptureBar onAddTask={handleQuickAdd} />

      {/* AI Task Decomposition Modal */}
      <AIDecomposeModal
        visible={decomposingTask !== null}
        task={decomposingTask}
        onClose={() => setDecomposingTask(null)}
        onApplySubtasks={onApplySubtasks}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  syncBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  syncBadgeText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  streakHeaderWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44, // WCAG 2.1 AA Touch Target >= 44x44 pt
    gap: 6,
  },
  streakBadgeItem: {
    justifyContent: 'center',
  },
  streakFireText: {
    color: '#FBBF24', // Sand Amber
    fontSize: 12,
    fontWeight: '700',
  },
  streakDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#334155',
  },
  freezeBadgeItem: {
    justifyContent: 'center',
  },
  freezeShieldText: {
    color: '#818CF8', // Soft Iris / Freeze Shield Token
    fontSize: 12,
    fontWeight: '700',
  },
  focusHeaderBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    minHeight: 44, // WCAG Touch-target >= 44x44 pt
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalShieldIcon: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 0.5,
  },
  modalEmpatheticMessage: {
    fontSize: 14,
    color: '#F8FAFC',
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
    marginBottom: 16,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  modalStatValueFire: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
    marginBottom: 4,
  },
  modalStatValueShield: {
    fontSize: 16,
    fontWeight: '800',
    color: '#818CF8',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalXpRow: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
    gap: 6,
  },
  modalXpText: {
    fontSize: 13,
    color: '#38BDF8',
  },
  modalBoldText: {
    fontWeight: '800',
  },
  modalTipText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#334155',
    minHeight: 48, // WCAG Touch target >= 44x44 pt
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  columnTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 6,
  },
  columnTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44, // WCAG Touch-target >= 44x44 pt
  },
  columnTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  columnTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginRight: 4,
  },
  columnTabTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: '#38BDF8',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  countBadgeTextActive: {
    color: '#0F172A',
  },
  filterHintBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  filterHintText: {
    color: '#38BDF8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  taskListContainer: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
