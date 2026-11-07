import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, EnergyLevel, TaskStatus, Subtask } from '../types';

interface TaskCardProps {
  task: Task;
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onOpenAIDecompose: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  isDimmed?: boolean;
  triggerRollback?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onMoveTask,
  onOpenAIDecompose,
  onFocusTask,
  onToggleSubtask,
  isDimmed = false,
  triggerRollback = false,
}) => {
  // Spring rollback animation for Edge Case 02 (WIP limit violation)
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (triggerRollback) {
      // Spring rollback physics adhering to specs: { damping: 15, stiffness: 120, mass: 1 }
      Animated.sequence([
        Animated.spring(translateX, {
          toValue: -16,
          damping: 15,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 10,
          damping: 15,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          damping: 15,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [triggerRollback]);

  // Energy styling helper (strictly no panic red #FF0000; uses Soft Coral #F87171)
  const getEnergyBadge = (level: EnergyLevel) => {
    switch (level) {
      case 'LOW':
        return { label: '☕ Thấp', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'HIGH':
        return { label: '🔥 Cao', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' };
      case 'MEDIUM':
      default:
        return { label: '⚡ Vừa', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
  };

  const energyInfo = getEnergyBadge(task.energyRequired);
  const subtasksList = task.subtasks || [];
  const completedSubtasks = subtasksList.filter((s) => s.isCompleted).length;
  const totalSubtasks = subtasksList.length;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleSubtaskPress = (subtaskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onToggleSubtask) {
      onToggleSubtask(task.id, subtaskId);
    }
  };

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
            <Text style={styles.nextBtnText}>Cần làm →</Text>
          </TouchableOpacity>
        );
      case 'TODO':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, styles.focusBtn]}
            onPress={() => onMoveTask(task.id, 'DOING')}
            activeOpacity={0.7}
          >
            <Text style={styles.focusBtnText}>Bắt đầu (Doing) 🎯</Text>
          </TouchableOpacity>
        );
      case 'DOING':
        return (
          <View style={styles.doingActionsGroup}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.revertBtn]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onMoveTask(task.id, 'TODO');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.revertBtnText}>← Trả lại</Text>
            </TouchableOpacity>

            {onFocusTask && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.focusNowBtn]}
                onPress={() => onFocusTask(task)}
                activeOpacity={0.8}
              >
                <Text style={styles.focusNowBtnText}>🎯 Tập trung</Text>
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
            <Text style={styles.reopenBtnText}>Làm lại ↺</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        task.status === 'DOING' && styles.doingCardHighlight,
        isDimmed && styles.cardDimmed,
        { transform: [{ translateX }] },
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
          <TouchableOpacity
            style={styles.metaBadge}
            onPress={() => setIsSubtasksExpanded((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.metaText}>
              📋 {completedSubtasks}/{totalSubtasks} vi bước {isSubtasksExpanded ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Progress Bar & Subtask Check-off Section */}
      {totalSubtasks > 0 && (
        <View style={styles.subtasksContainer}>
          {/* Progress Header and Bar */}
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressTitle}>Tiến độ vi bước:</Text>
            <Text style={styles.progressPercentText}>
              {completedSubtasks}/{totalSubtasks} ({progressPercent}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                progressPercent === 100 && styles.progressBarFillComplete,
              ]}
            />
          </View>

          {/* Expanded Micro-steps checklist */}
          {isSubtasksExpanded && (
            <View style={styles.subtasksList}>
              {subtasksList.map((sub: Subtask) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.subtaskRow,
                    sub.isCompleted && styles.subtaskRowCompleted,
                  ]}
                  onPress={() => handleSubtaskPress(sub.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      sub.isCompleted && styles.checkboxChecked,
                    ]}
                  >
                    {sub.isCompleted && (
                      <Text style={styles.checkmarkIcon}>✓</Text>
                    )}
                  </View>

                  <View style={styles.subtaskContent}>
                    <Text
                      style={[
                        styles.subtaskTitle,
                        sub.isCompleted && styles.subtaskTitleCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {sub.title}
                    </Text>
                    <View style={styles.subtaskMetaRow}>
                      <Text style={styles.subtaskMetaText}>
                        ⏱️ {sub.estimatedMinutes}m
                      </Text>
                      <Text style={styles.subtaskMetaText}>
                        • {sub.energyLevel === 'LOW' ? '☕ Nhẹ' : sub.energyLevel === 'MEDIUM' ? '⚡ Vừa' : '🔥 Sâu'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => onOpenAIDecompose(task)}
          activeOpacity={0.7}
        >
          <Text style={styles.aiButtonText}>✨ AI Bẻ việc</Text>
        </TouchableOpacity>

        <View style={styles.statusActionWrapper}>{renderStatusAction()}</View>
      </View>
    </Animated.View>
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
    marginBottom: 12,
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
  subtasksContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  progressPercentText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  progressBarFillComplete: {
    backgroundColor: '#34D399', // Mint Emerald
  },
  subtasksList: {
    gap: 6,
    marginTop: 4,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44, // WCAG 2.1 AA touch target >= 44x44 pt
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
  },
  subtaskRowCompleted: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  subtaskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  subtaskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtaskMetaText: {
    fontSize: 10,
    color: '#64748B',
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
    minHeight: 44, // WCAG 2.1 AA touch-target >= 44x44 pt
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44, // WCAG 2.1 AA touch-target >= 44x44 pt
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
    flexWrap: 'wrap',
    gap: 8, // Minimum 8px spacing
  },
  revertBtn: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  revertBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
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
