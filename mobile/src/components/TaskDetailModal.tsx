import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, Subtask, EnergyLevel, UrgencyLevel, TaskStatus } from '../types';

export interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onApplySubtasks: (taskId: string, newSubtasks: Subtask[]) => void;
  onOpenAIDecompose: (task: Task) => void;
  onStartFocus: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
  onApplySubtasks,
  onOpenAIDecompose,
  onStartFocus,
}) => {
  if (!task) return null;

  // Local state for editing fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [energyRequired, setEnergyRequired] = useState<EnergyLevel>(task.energyRequired || 'MEDIUM');
  const [urgency, setUrgency] = useState<UrgencyLevel>(task.urgency || 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task.status);

  // Manual subtask adding state
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskMinutes, setNewSubtaskMinutes] = useState('15');

  // Gentle delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state whenever the selected task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setEnergyRequired(task.energyRequired || 'MEDIUM');
      setUrgency(task.urgency || 'MEDIUM');
      setStatus(task.status);
      setIsAddingSubtask(false);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const subtasksList = task.subtasks || [];
  const completedSubtasks = subtasksList.filter((s) => s.isCompleted).length;
  const totalSubtasks = subtasksList.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const totalEstimatedMinutes = subtasksList.reduce(
    (sum, s) => sum + (s.estimatedMinutes || 15),
    0
  ) || (task.estimatedMinutes || 15);

  // Save changes on dismiss or explicit save
  const handleSaveAndClose = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onClose();
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onUpdateTask(task.id, {
      title: trimmedTitle,
      description: description.trim() || undefined,
      energyRequired,
      urgency,
      status,
    });
    onClose();
  };

  const handleSubtaskCheck = (subtaskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleSubtask(task.id, subtaskId);
  };

  const handleAddManualSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    const minutes = parseInt(newSubtaskMinutes, 10) || 15;
    const newStepOrder = subtasksList.length + 1;

    const newSubtask: Subtask = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: task.id,
      title: trimmed,
      estimatedMinutes: minutes,
      energyLevel: energyRequired,
      stepOrder: newStepOrder,
      isCompleted: false,
    };

    const updatedSubtasks = [...subtasksList, newSubtask];
    onApplySubtasks(task.id, updatedSubtasks);

    setNewSubtaskTitle('');
    setNewSubtaskMinutes('15');
    setIsAddingSubtask(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const filtered = subtasksList.filter((s) => s.id !== subtaskId);
    onApplySubtasks(task.id, filtered);
  };

  const handleConfirmDeleteTask = () => {
    setShowDeleteConfirm(false);
    onDeleteTask(task.id);
    onClose();
  };

  const handleTriggerFocus = () => {
    handleSaveAndClose();
    onStartFocus(task);
  };

  const getStatusBadge = (st: TaskStatus) => {
    switch (st) {
      case 'DOING':
        return { label: 'ĐANG LÀM 🎯', bg: 'rgba(56, 189, 248, 0.2)', text: '#38BDF8' };
      case 'DONE':
        return { label: 'ĐÃ XONG ✓', bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399' };
      case 'TODO':
        return { label: 'CẦN LÀM ⚡', bg: 'rgba(251, 191, 36, 0.2)', text: '#FBBF24' };
      case 'BACKLOG':
      default:
        return { label: 'BACKLOG ☕', bg: 'rgba(148, 163, 184, 0.2)', text: '#94A3B8' };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleSaveAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContainer}>
          {/* Top Bar: Close & Status */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleSaveAndClose}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Đóng chi tiết nhiệm vụ và lưu thay đổi"
            >
              <Text style={styles.closeBtnText}>✕ Đóng</Text>
            </TouchableOpacity>

            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {/* Task Title Input */}
            <Text style={styles.sectionLabel}>TIÊU ĐỀ NHIỆM VỤ</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề nhiệm vụ..."
              placeholderTextColor="#64748B"
              multiline={true}
              accessible={true}
              accessibilityLabel="Sửa tiêu đề nhiệm vụ"
            />

            {/* Task Description / Notes */}
            <Text style={styles.sectionLabel}>GHI CHÚ & YÊU CẦU CHI TIẾT</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Thêm ghi chú, lưu ý hoặc dán nội dung tham khảo..."
              placeholderTextColor="#64748B"
              multiline={true}
              textAlignVertical="top"
              accessible={true}
              accessibilityLabel="Sửa ghi chú nhiệm vụ"
            />

            {/* Micro-Actions / Subtasks Checklist Section */}
            <View style={styles.subtasksSection}>
              <View style={styles.subtasksHeaderRow}>
                <Text style={styles.subtasksSectionTitle}>
                  DANH SÁCH BƯỚC NHỎ
                </Text>
                <Text style={styles.subtasksProgressText}>
                  {completedSubtasks}/{totalSubtasks} bước ({progressPercent}%)
                </Text>
              </View>

              {/* Progress Bar */}
              {totalSubtasks > 0 && (
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              )}

              {/* Subtasks Items */}
              {subtasksList.length === 0 ? (
                <View style={styles.emptySubtasksBox}>
                  <Text style={styles.emptySubtasksText}>
                    Chưa có vi bước nào. Bạn có thể tự thêm hoặc để AI gợi ý 3-5 bước mồi nhẹ nhàng nhé!
                  </Text>
                </View>
              ) : (
                subtasksList.map((item, index) => (
                  <View key={item.id || `subtask-${index}`} style={styles.subtaskRow}>
                    <TouchableOpacity
                      style={styles.checkboxTouch}
                      onPress={() => handleSubtaskCheck(item.id)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: item.isCompleted }}
                      accessibilityLabel={`Bước ${index + 1}: ${item.title}`}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          item.isCompleted && styles.checkboxBoxChecked,
                        ]}
                      >
                        {item.isCompleted && (
                          <Text style={styles.checkmarkIcon}>✓</Text>
                        )}
                      </View>
                      <View style={styles.subtaskInfo}>
                        <Text
                          style={[
                            styles.subtaskTitle,
                            item.isCompleted && styles.subtaskTitleDone,
                          ]}
                        >
                          {index + 1}. {item.title}
                        </Text>
                        <Text style={styles.subtaskMinutes}>
                          ⏱️ {item.estimatedMinutes || 15} phút
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteSubtaskBtn}
                      onPress={() => handleDeleteSubtask(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa bước ${item.title}`}
                    >
                      <Text style={styles.deleteSubtaskBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Inline Add Subtask Form */}
              {isAddingSubtask ? (
                <View style={styles.inlineAddContainer}>
                  <TextInput
                    style={styles.inlineAddInput}
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    placeholder="Tên vi bước (<20 phút)..."
                    placeholderTextColor="#64748B"
                    autoFocus={true}
                  />
                  <View style={styles.inlineAddRow}>
                    <View style={styles.inlineMinutesBox}>
                      <Text style={styles.inlineMinutesLabel}>Phút:</Text>
                      <TextInput
                        style={styles.inlineMinutesInput}
                        value={newSubtaskMinutes}
                        onChangeText={setNewSubtaskMinutes}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                    <View style={styles.inlineBtnGroup}>
                      <TouchableOpacity
                        style={styles.inlineCancelBtn}
                        onPress={() => setIsAddingSubtask(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.inlineCancelText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inlineConfirmBtn}
                        onPress={handleAddManualSubtask}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.inlineConfirmText}>+ Thêm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* Action buttons row: Add manual + AI Decompose */
                <View style={styles.subtaskActionRow}>
                  <TouchableOpacity
                    style={styles.addManualBtn}
                    onPress={() => setIsAddingSubtask(true)}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Thêm bước nhỏ thủ công"
                  >
                    <Text style={styles.addManualBtnText}>+ Thêm bước nhỏ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.aiDecomposeBtn}
                    onPress={() => {
                      onClose();
                      onOpenAIDecompose(task);
                    }}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Bẻ nhỏ công việc bằng AI Gemini"
                  >
                    <Text style={styles.aiDecomposeBtnText}>✨ AI Bẻ việc</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Task Metadata: Energy & Urgency */}
            <View style={styles.metaSection}>
              <Text style={styles.sectionLabel}>MỨC NĂNG LƯỢNG YÊU CẦU</Text>
              <View style={styles.pillRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as EnergyLevel[]).map((level) => {
                  const isSelected = energyRequired === level;
                  const label =
                    level === 'LOW'
                      ? '☕ Thấp'
                      : level === 'HIGH'
                      ? '🔥 Cao'
                      : '⚡ Vừa';
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.pillOption,
                        isSelected && styles.pillOptionActive,
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setEnergyRequired(level);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          isSelected && styles.pillOptionTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                ĐỘ KHẨN CẤP
              </Text>
              <View style={styles.pillRow}>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map(
                  (urg) => {
                    const isSelected = urgency === urg;
                    const label =
                      urg === 'LOW'
                        ? '🌱 Thảnh thơi'
                        : urg === 'CRITICAL'
                        ? '🔥 Rất gấp'
                        : urg === 'HIGH'
                        ? '⚡ Gấp'
                        : '🌿 Bình thường';
                    return (
                      <TouchableOpacity
                        key={urg}
                        style={[
                          styles.pillOption,
                          isSelected && styles.pillOptionActive,
                        ]}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setUrgency(urg);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pillOptionText,
                            isSelected && styles.pillOptionTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <View style={styles.estimateSummaryRow}>
                <Text style={styles.estimateSummaryText}>
                  ⏱️ Tổng thời lượng: <Text style={styles.boldText}>{totalEstimatedMinutes} phút</Text>
                </Text>
              </View>
            </View>

            {/* Primary Action Button: Focus Mode */}
            <TouchableOpacity
              style={styles.focusPrimaryBtn}
              onPress={handleTriggerFocus}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Bắt đầu chế độ tập trung với nhiệm vụ này"
            >
              <Text style={styles.focusPrimaryBtnText}>
                🎯 BẮT ĐẦU CHẾ ĐỘ FOCUS NGAY
              </Text>
            </TouchableOpacity>

            {/* Bottom Actions: Save changes & Gentle Delete */}
            <View style={styles.bottomActionsRow}>
              <TouchableOpacity
                style={styles.deleteTaskBtn}
                onPress={() => setShowDeleteConfirm(true)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Xóa nhiệm vụ này"
              >
                <Text style={styles.deleteTaskBtnText}>🗑️ Xóa nhiệm vụ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAndClose}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Lưu thay đổi nhiệm vụ"
              >
                <Text style={styles.saveBtnText}>✓ Lưu lại</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Gentle Confirmation Dialog for Deletion (Strictly no panic red #FF0000; uses Soft Coral #F87171) */}
          {showDeleteConfirm && (
            <View style={styles.confirmBackdrop}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmIcon}>🌿</Text>
                <Text style={styles.confirmTitle}>Dọn dẹp nhiệm vụ?</Text>
                <Text style={styles.confirmMessage}>
                  "Bạn có muốn bỏ nhiệm vụ này không? Orbit sẽ dọn dẹp nhẹ nhàng giúp không gian làm việc của bạn luôn thông thoáng."
                </Text>

                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setShowDeleteConfirm(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>Giữ lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmDeleteBtn}
                    onPress={handleConfirmDeleteTask}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDeleteText}>Xóa 🌿</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  scrollInner: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 48,
  },
  descriptionInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 76,
    marginBottom: 20,
  },
  subtasksSection: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 20,
  },
  subtasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtasksSectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subtasksProgressText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  emptySubtasksBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptySubtasksText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  checkboxTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  subtaskInfo: {
    flex: 1,
  },
  subtaskTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  subtaskTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  subtaskMinutes: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  deleteSubtaskBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSubtaskBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  inlineAddContainer: {
    marginTop: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inlineAddInput: {
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 8,
  },
  inlineAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineMinutesBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineMinutesLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 6,
  },
  inlineMinutesInput: {
    backgroundColor: '#0F172A',
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 44,
    textAlign: 'center',
  },
  inlineBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineCancelBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  inlineCancelText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  inlineConfirmBtn: {
    minHeight: 44,
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineConfirmText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  subtaskActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  addManualBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addManualBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  aiDecomposeBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDecomposeBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  metaSection: {
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  pillOptionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  pillOptionTextActive: {
    color: '#38BDF8',
  },
  estimateSummaryRow: {
    marginTop: 12,
  },
  estimateSummaryText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  boldText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  focusPrimaryBtn: {
    minHeight: 52,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  focusPrimaryBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  deleteTaskBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTaskBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  confirmTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
});
