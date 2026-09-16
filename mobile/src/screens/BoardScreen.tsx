import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Task, TaskStatus, EnergyLevel, Subtask } from '../types';
import { TaskCard } from '../components/TaskCard';
import { QuickCaptureBar } from '../components/QuickCaptureBar';
import { AIDecomposeModal } from '../components/AIDecomposeModal';
import {
  EnergyFilterWidget,
  EnergyFilterType,
} from '../components/EnergyFilterWidget';

// [Fix #1] All props are required — no internal mock data.
// Single source of truth for tasks lives in App.tsx.
// Previously this file duplicated ~130 lines of INITIAL_MOCK_TASKS
// that was dead code when App.tsx passed the `tasks` prop.
export interface BoardScreenProps {
  tasks: Task[];
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onQuickAdd: (title: string, energy: EnergyLevel) => void;
  onApplySubtasks: (taskId: string, newSubtasks: Subtask[]) => void;
  onNavigateFocus?: () => void;
  onFocusTask?: (task: Task) => void;
}

export const BoardScreen: React.FC<BoardScreenProps> = ({
  tasks,
  onMoveTask,
  onQuickAdd,
  onApplySubtasks,
  onNavigateFocus,
  onFocusTask,
}) => {
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('TODO');
  const [decomposingTask, setDecomposingTask] = useState<Task | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyFilterType>('ALL');

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

  // [Fix #7] Inline columnTasks filter into the useMemo so that
  // the memo depends on stable references (tasks, activeColumn, selectedEnergy)
  // instead of a freshly-allocated `columnTasks` array each render.
  const displayedTasks = useMemo(() => {
    const columnTasks = tasks.filter((t) => t.status === activeColumn);

    if (selectedEnergy === 'ALL') {
      return columnTasks.map((t) => ({ task: t, isDimmed: false }));
    }

    // Dynamic Re-ranking & Dimming based on Energy Filter
    // When '☕ Thấp' is selected, low energy tasks are elevated to top with full opacity,
    // while high/medium energy tasks are demoted and visually dimmed (opacity ~ 0.38).
    const matched = columnTasks.filter((t) => t.energyRequired === selectedEnergy);
    const unmatched = columnTasks.filter((t) => t.energyRequired !== selectedEnergy);

    return [
      ...matched.map((t) => ({ task: t, isDimmed: false })),
      ...unmatched.map((t) => ({ task: t, isDimmed: true })),
    ];
  }, [tasks, activeColumn, selectedEnergy]);

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🌌 Orbit</Text>
          <Text style={styles.headerSubtitle}>
            Điều phối công việc cho tâm trí ADHD
          </Text>
        </View>

        {onNavigateFocus && (
          <TouchableOpacity
            style={styles.focusHeaderBtn}
            onPress={onNavigateFocus}
            activeOpacity={0.8}
          >
            <Text style={styles.focusHeaderBtnText}>🎯 Focus Mode</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Energy Filter & Streak Shield Widget */}
      <EnergyFilterWidget
        selectedEnergy={selectedEnergy}
        onSelectEnergy={setSelectedEnergy}
        streakDays={5}
        freezeCount={1}
      />

      {/* Column Tabs */}
      <View style={styles.columnTabBar}>
        {columns.map((col) => {
          const isActive = activeColumn === col.status;
          return (
            <TouchableOpacity
              key={col.status}
              style={[styles.columnTab, isActive && styles.columnTabActive]}
              onPress={() => setActiveColumn(col.status)}
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

      {/* Task Cards List with Energy-based Rerank and Dimming */}
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
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>Chưa có công việc nào ở cột này</Text>
            <Text style={styles.emptySubtitle}>
              Thêm nhanh một việc ở thanh dưới đáy để bắt đầu nhẹ nhàng nhé!
            </Text>
          </View>
        ) : (
          displayedTasks.map(({ task, isDimmed }) => (
            <TaskCard
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
              onOpenAIDecompose={(t) => setDecomposingTask(t)}
              onFocusTask={handleFocusTaskAction}
              isDimmed={isDimmed}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  focusHeaderBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  focusHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
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
    minHeight: 40,
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
