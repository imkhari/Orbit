import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Task, EnergyLevel, Subtask } from '../types';

interface ProposedStep {
  id: string;
  stepOrder: number;
  title: string;
  estimatedMinutes: number;
  energyLevel: EnergyLevel;
  isSelected: boolean;
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

  // Generate contextual AI proposals when task opens
  useEffect(() => {
    if (!task) return;

    // Intelligent default proposals based on task title
    const mockAIProposals: ProposedStep[] = [
      {
        id: 'step-1',
        stepOrder: 1,
        title: `Mở tài liệu và viết dàn ý 3 ý chính cho "${task.title}"`,
        estimatedMinutes: 5,
        energyLevel: 'LOW',
        isSelected: true,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        title: 'Thu thập thông tin & tài liệu tham khảo cần thiết',
        estimatedMinutes: 15,
        energyLevel: 'MEDIUM',
        isSelected: true,
      },
      {
        id: 'step-3',
        stepOrder: 3,
        title: 'Thực hiện phần cốt lõi đầu tiên (bản nháp 1)',
        estimatedMinutes: 20,
        energyLevel: 'HIGH',
        isSelected: true,
      },
      {
        id: 'step-4',
        stepOrder: 4,
        title: 'Kiểm tra lại kết quả và định dạng hoàn chỉnh',
        estimatedMinutes: 10,
        energyLevel: 'LOW',
        isSelected: true,
      },
    ];

    setSteps(mockAIProposals);
  }, [task]);

  const toggleSelect = (id: string) => {
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

  const handleApply = () => {
    if (!task) return;
    const selected = steps.filter((s) => s.isSelected);
    if (selected.length === 0) return;

    const formattedSubtasks: Subtask[] = selected.map((s, idx) => ({
      id: `subtask-${Date.now()}-${idx}`,
      taskId: task.id,
      title: s.title,
      estimatedMinutes: s.estimatedMinutes,
      energyLevel: s.energyLevel,
      stepOrder: idx + 1,
      isCompleted: false,
    }));

    onApplySubtasks(task.id, formattedSubtasks);
    onClose();
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
            <Text style={styles.badgeText}>✨ HUMAN-IN-THE-LOOP AI BREAKDOWN</Text>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={styles.instruction}>
              AI đã chia nhỏ thành các bước dưới 20 phút. Bạn có thể sửa trực
              tiếp hoặc bỏ chọn trước khi thêm:
            </Text>
          </View>

          {/* Steps List */}
          <ScrollView style={styles.stepList}>
            {steps.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.stepRow,
                  !step.isSelected && styles.stepRowDeselected,
                ]}
              >
                {/* Checkbox */}
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    step.isSelected && styles.checkboxChecked,
                  ]}
                  onPress={() => toggleSelect(step.id)}
                  activeOpacity={0.7}
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
                  />
                  <View style={styles.stepMetaRow}>
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

          {/* Focus Summary */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              Tổng thời gian: <Text style={styles.bold}>{totalMinutes} phút</Text>{' '}
              ({selectedCount} bước được chọn)
            </Text>
          </View>

          {/* Action buttons */}
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
                selectedCount === 0 && styles.confirmBtnDisabled,
              ]}
              onPress={handleApply}
              disabled={selectedCount === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>
                Áp dụng ({selectedCount})
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  stepList: {
    maxHeight: 320,
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
  stepRowDeselected: {
    opacity: 0.45,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
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
    marginBottom: 4,
  },
  stepInputDeselected: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  stepMetaRow: {
    flexDirection: 'row',
    gap: 8,
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
});
