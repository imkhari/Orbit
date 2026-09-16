import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Task, EnergyLevel, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onOpenAIDecompose: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  isDimmed?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onMoveTask,
  onOpenAIDecompose,
  onFocusTask,
  isDimmed = false,
}) => {
  // Energy styling helper
  const getEnergyBadge = (level: EnergyLevel) => {
    switch (level) {
      case 'LOW':
        return { label: '☕ Low', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'HIGH':
        return { label: '🔥 High', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' };
      case 'MEDIUM':
      default:
        return { label: '⚡ Med', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
  };

  const energyInfo = getEnergyBadge(task.energyRequired);
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  // Compute next action label based on status
  const renderStatusAction = () => {
    switch (task.status) {
      case 'BACKLOG':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, styles.nextBtn]}
            onPress={() => onMoveTask(task.id, 'TODO')}
            activeOpacity={0.7}
          >
            <Text style={styles.nextBtnText}>To Todo →</Text>
          </TouchableOpacity>
        );
      case 'TODO':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, styles.focusBtn]}
            onPress={() => onMoveTask(task.id, 'DOING')}
            activeOpacity={0.7}
          >
            <Text style={styles.focusBtnText}>Start (Doing) 🎯</Text>
          </TouchableOpacity>
        );
      case 'DOING':
        return (
          <View style={styles.doingActionsGroup}>
            {onFocusTask && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.focusNowBtn]}
                onPress={() => onFocusTask(task)}
                activeOpacity={0.8}
              >
                <Text style={styles.focusNowBtnText}>🎯 Tập trung ngay</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.doneBtn]}
              onPress={() => onMoveTask(task.id, 'DONE')}
              activeOpacity={0.7}
            >
              <Text style={styles.doneBtnText}>Xong ✓</Text>
            </TouchableOpacity>
          </View>
        );
      case 'DONE':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, styles.reopenBtn]}
            onPress={() => onMoveTask(task.id, 'TODO')}
            activeOpacity={0.7}
          >
            <Text style={styles.reopenBtnText}>Reopen ↺</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View
      style={[
        styles.card,
        task.status === 'DOING' && styles.doingCardHighlight,
        isDimmed && styles.cardDimmed,
      ]}
    >
      {/* Header: Title & Energy Badge */}
      <View style={styles.headerRow}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={[styles.energyPill, { backgroundColor: energyInfo.bg }]}>
          <Text style={[styles.energyText, { color: energyInfo.color }]}>
            {energyInfo.label}
          </Text>
        </View>
      </View>

      {/* Description if present */}
      {task.description ? (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Meta tags: Estimated Time & Subtasks count */}
      <View style={styles.metaRow}>
        {task.estimatedMinutes ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>⏱️ {task.estimatedMinutes}m</Text>
          </View>
        ) : null}

        {totalSubtasks > 0 ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              📋 {completedSubtasks}/{totalSubtasks} steps
            </Text>
          </View>
        ) : null}
      </View>

      {/* Actions footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => onOpenAIDecompose(task)}
          activeOpacity={0.7}
        >
          <Text style={styles.aiButtonText}>✨ AI Breakdown</Text>
        </TouchableOpacity>

        <View style={styles.statusActionWrapper}>{renderStatusAction()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  doingCardHighlight: {
    borderColor: '#38BDF8',
    borderLeftWidth: 4,
    backgroundColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 10,
    lineHeight: 22,
  },
  energyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  energyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  metaBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  metaText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
  },
  aiButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    minHeight: 38,
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  statusActionWrapper: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#334155',
  },
  nextBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  focusBtn: {
    backgroundColor: '#0284C7',
  },
  focusBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#059669',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reopenBtn: {
    backgroundColor: '#475569',
  },
  reopenBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDimmed: {
    opacity: 0.38,
    borderStyle: 'dashed',
    borderColor: '#475569',
  },
  doingActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusNowBtn: {
    backgroundColor: '#0284C7',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  focusNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

