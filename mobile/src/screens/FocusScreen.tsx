import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Task, Subtask } from '../types';
import { FocusTimer } from '../components/FocusTimer';

interface FocusScreenProps {
  doingTask: Task | null;
  onExitFocus: () => void;
  onCompleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  doingTask,
  onExitFocus,
  onCompleteTask,
  onToggleSubtask,
}) => {
  // [Fix #5] Guard against double-tap on "Hoàn thành" button.
  // Previously `celebrated` was set but never read — now `isSubmitting`
  // disables the button after the first tap to prevent duplicate completions.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If no task is currently in DOING
  if (!doingTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Chưa có công việc trong "Đang làm"</Text>
          <Text style={styles.emptySubtitle}>
            Hãy quay lại bảng Kanban và chọn 1 việc đưa vào cột "Đang làm" để kích hoạt chế độ tập trung đơn nhiệm nhé!
          </Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={onExitFocus}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>← Quay lại bảng Kanban</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtasks = doingTask.subtasks || [];
  const completedCount = subtasks.filter((s) => s.isCompleted).length;
  const totalCount = subtasks.length;
  const percentDone =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleFinishTask = () => {
    if (isSubmitting) return; // Prevent double-tap
    setIsSubmitting(true);
    Alert.alert(
      '🎉 Xuất sắc!',
      `Bạn đã hoàn thành công việc "${doingTask.title}". Dopamine dâng trào, hãy nghỉ ngơi một chút trước khi nhận việc tiếp theo!`,
      [
        {
          text: 'Về bảng Kanban',
          onPress: () => {
            onCompleteTask(doingTask.id);
            onExitFocus();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Focus Mode Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onExitFocus}
          activeOpacity={0.7}
        >
          <Text style={styles.exitButtonText}>← Bảng Kanban</Text>
        </TouchableOpacity>

        <View style={styles.focusModePill}>
          <Text style={styles.focusModePillText}>🎯 Chế độ Đơn Nhiệm</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Doing Task Spotlight */}
        <View style={styles.spotlightCard}>
          <View style={styles.taskMetaRow}>
            <View style={styles.doingIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.doingIndicatorText}>ĐANG THỰC HIỆN DUY NHẤT</Text>
            </View>
            {/* [Fix #6] energyRequired is a required field on Task (always truthy), no conditional needed */}
            <View style={styles.energyBadge}>
              <Text style={styles.energyBadgeText}>
                {doingTask.energyRequired === 'LOW'
                  ? '☕ Nhẹ'
                  : doingTask.energyRequired === 'HIGH'
                  ? '🔥 Nặng'
                  : '⚡ Vừa'}
              </Text>
            </View>
          </View>

          <Text style={styles.taskTitle}>{doingTask.title}</Text>
          {doingTask.description ? (
            <Text style={styles.taskDesc}>{doingTask.description}</Text>
          ) : null}
        </View>

        {/* Central Focus Pomodoro Timer */}
        <View style={styles.timerSection}>
          <FocusTimer
            initialMinutes={25}
            onComplete={() => {
              Alert.alert(
                '⏰ Hết 25 phút Pomodoro!',
                'Tuyệt vời! Bạn vừa hoàn thành một phiên tập trung sâu. Hãy duỗi người, uống một ngụm nước nhé!'
              );
            }}
          />
        </View>

        {/* Micro-steps Checklist */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistTitle}>📋 Các bước nhỏ (Micro-steps)</Text>
            {totalCount > 0 && (
              <Text style={styles.stepCounterText}>
                {completedCount}/{totalCount} ({percentDone}%)
              </Text>
            )}
          </View>

          {totalCount === 0 ? (
            <View style={styles.noSubtasksBox}>
              <Text style={styles.noSubtasksText}>
                Chưa có bước nhỏ nào được thêm. Bạn có thể tập trung hoàn thành toàn bộ công việc này theo nhịp 25 phút!
              </Text>
            </View>
          ) : (
            <View style={styles.subtasksList}>
              {subtasks.map((sub: Subtask) => {
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.subtaskItem,
                      sub.isCompleted && styles.subtaskItemCompleted,
                    ]}
                    onPress={() => onToggleSubtask(doingTask.id, sub.id)}
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

                    <View style={styles.subtaskTextWrapper}>
                      <Text
                        style={[
                          styles.subtaskTitle,
                          sub.isCompleted && styles.subtaskTitleCompleted,
                        ]}
                      >
                        {sub.title}
                      </Text>
                      <Text style={styles.subtaskMeta}>
                        ⏱️ ~{sub.estimatedMinutes}m • {sub.energyLevel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Action Button: Mark Task Done */}
        <View style={styles.bottomActionWrapper}>
          <TouchableOpacity
            style={[styles.completeTaskBtn, isSubmitting && styles.completeTaskBtnDisabled]}
            onPress={handleFinishTask}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Text style={styles.completeTaskBtnText}>
              ✓ Hoàn thành công việc này
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitSecondaryBtn}
            onPress={onExitFocus}
            activeOpacity={0.7}
          >
            <Text style={styles.exitSecondaryBtnText}>
              Tạm dừng và quay lại bảng
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  exitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  exitButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  focusModePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  focusModePillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  spotlightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  doingIndicatorText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  energyBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  energyBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 24,
  },
  taskDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  timerSection: {
    marginVertical: 10,
  },
  checklistCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 8,
    marginBottom: 20,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepCounterText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  noSubtasksBox: {
    paddingVertical: 10,
  },
  noSubtasksText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  subtasksList: {
    gap: 10,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 48,
  },
  subtaskItemCompleted: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subtaskTextWrapper: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  subtaskTitleCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  subtaskMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bottomActionWrapper: {
    gap: 10,
  },
  completeTaskBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  completeTaskBtnDisabled: {
    opacity: 0.5,
  },
  exitSecondaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitSecondaryBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  returnBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
