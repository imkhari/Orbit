import { useLocale } from '../ui/locale';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, EnergyLevel, Subtask, AIDecomposeResponse } from '../types';
import { TaskService } from '../services/api';
import { useTaskStore } from '../store/useTaskStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, ScreenHeader } from '../ui/Controls';
import { colors } from '../ui/theme';
import { useSettingsStore } from '../store/useSettingsStore';

interface ProposedStep {
  id: string;
  title: string;
  estimatedMinutes: number;
  energyLevel: EnergyLevel;
  isSelected: boolean;
}

interface AIDecomposeModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onApplySubtasks: (taskId: string, subtasks: Subtask[]) => Promise<Task | null>;
  onStartFocus: (taskId: string, step?: Subtask) => Promise<boolean>;
  doingTask: Task | null;
}

export const AIDecomposeModal: React.FC<AIDecomposeModalProps> = ({
  visible,
  task,
  onClose,
  onApplySubtasks,
  onStartFocus,
  doingTask,
}) => {
  const t = useLocale();
  const [steps, setSteps] = useState<ProposedStep[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'save' | 'start' | null>(null);
  const [savedTask, setSavedTask] = useState<Task | null>(null);
  const saving = useRef(false);

  // Tự động gọi API AI decompose khi modal mở ra
  useEffect(() => {
    if (!visible || !task) {
      setSteps([]);
      setIsLoading(false);
      setIsApplying(false);
      setIsFallback(false);
      setSaveError(null);
      setConfirmAction(null);
      setSavedTask(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsFallback(false);
    setSaveError(null);

    const fetchDecomposition = async () => {
      const language = useSettingsStore.getState().language === 'en' ? 'en' : 'vi';
      try {
        const ready = task.id.startsWith('temp-')
          ? await Promise.race([
            useTaskStore.getState().ensureTask(task.id, false),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
          ])
          : task;
        if (!isMounted) return;
        const response: AIDecomposeResponse | null = ready
          ? await TaskService.decomposeWithAI(ready.id, language).catch(() => null)
          : null;
        if (!isMounted) return;
        const suggestions = response?.suggestedSubtasks;
        const fallbackStarter = /slide|thuyết trình/i.test(task.title)
          ? t("Mở slide và viết 3 ý chính", "Open the slides and write down three main points")
          : t("Chuẩn bị thứ đầu tiên bạn cần để bắt đầu", "Get the first thing you need to start");
        const source = suggestions?.length ? suggestions.slice(0, 5) : [
          { title: fallbackStarter, estimatedMinutes: 3, energyLevel: 'LOW' as const },
          { title: t("Thực hiện phần đầu tiên của việc này", "Do the first part of the task"), estimatedMinutes: 10, energyLevel: 'LOW' as const },
          { title: t("Xem lại kết quả và ghi việc cần làm tiếp", "Review what you did and write down what comes next"), estimatedMinutes: 5, energyLevel: 'LOW' as const },
        ];
        setSteps(source.map((step, index) => ({
          id: `proposal-${index}`,
          title: step.title,
          estimatedMinutes: Math.min(index === 0 ? 4 : 20, Math.max(1, step.estimatedMinutes)),
          energyLevel: step.energyLevel,
          isSelected: true,
        })));
        setIsFallback(!suggestions?.length || Boolean(response?.isFallback));
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
    setSavedTask(null);
    setConfirmAction(null);
    setSaveError(null);
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, isSelected: !step.isSelected } : step
      )
    );
  };

  const updateTitle = (id: string, newTitle: string) => {
    setSavedTask(null);
    setConfirmAction(null);
    setSaveError(null);
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, title: newTitle } : step))
    );
  };

  const selected = steps.filter((step) => step.isSelected);
  const originalStarter = selected.find((step) => step.estimatedMinutes < 5) ?? selected[0];
  const starter = originalStarter?.estimatedMinutes >= 5 ? {
    ...originalStarter,
    title: t(`Làm 4 phút đầu của bước này — ${originalStarter.title.trim()}`, `Do the first 4 minutes of this step — ${originalStarter.title.trim()}`),
    estimatedMinutes: 4,
  } : originalStarter;
  const planned = starter ? [starter, ...selected.filter((step) => step.id !== starter.id)] : [];
  const valid = planned.length > 0 && selected.every((step) => step.title.trim())
    && planned.every((step) => step.title.trim().length <= 255);
  const blockedBy = doingTask && doingTask.id !== (savedTask?.id ?? task?.id) ? doingTask : null;

  const handleApply = async (action: 'save' | 'start', confirmed = false) => {
    if (!task || !valid || saving.current) return;
    if (!savedTask && task.subtasks.length > 0 && !confirmed) {
      setConfirmAction(action);
      return;
    }

    saving.current = true;
    setIsApplying(true);
    setConfirmAction(null);
    setSaveError(null);
    try {
      const checklist = planned.map((step, index): Subtask => ({
        id: step.id,
        taskId: task.id,
        title: step.title.trim(),
        estimatedMinutes: step.estimatedMinutes,
        energyLevel: step.energyLevel,
        stepOrder: index + 1,
        isCompleted: false,
      }));
      const saved = savedTask ?? await onApplySubtasks(task.id, checklist);
      if (!saved) {
        setSaveError(t("Chưa lưu được các bước. Nội dung bạn đã chỉnh vẫn ở đây. Bạn có thể thử lại.", "Could not save the steps. Your edits are still here. Try again."));
        return;
      }
      setSavedTask(saved);
      const first = saved.subtasks.find((step) => step.stepOrder === 1);
      if (action === 'start' && (!first || !await onStartFocus(saved.id, first))) {
        setSaveError(t("Đã lưu các bước. Bạn có thể thử bắt đầu lại.", "Steps saved. Try starting again."));
        return;
      }
      onClose();
    } finally {
      saving.current = false;
      setIsApplying(false);
    }
  };

  if (!task) return null;

  const canSubmit = valid && !isApplying && !isLoading;
  return (
    <Modal visible={visible} transparent animationType="none"
      onRequestClose={() => { if (!saving.current) onClose(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.header}>
            <ScreenHeader title={t('Chia việc thành các bước', 'Break down task')}
              onClose={() => { if (!saving.current) onClose(); }} />
            <Text style={styles.muted} numberOfLines={2}>{task.title}</Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <>
                <Text style={styles.muted} accessibilityLiveRegion="polite">{t("Đang chia việc…", "Planning your steps…")}</Text>
                {[0, 1, 2].map((item) => <View key={item} style={styles.skeleton} />)}
              </>
            ) : (
              <>
                {starter && (
                  <View style={styles.preview}>
                    <Text style={styles.stepLabel}>{t(`Bước đầu tiên · ${starter.estimatedMinutes} phút`, `First step · ${starter.estimatedMinutes} min`)}</Text>
                    <Text style={styles.previewTitle}>{starter.title.trim()}</Text>
                  </View>
                )}
                <Text style={styles.muted}>{isFallback ? t("Gợi ý nhanh · ", "Quick suggestions · ") : ''}{t("Chạm tên bước để sửa.", "Tap a step name to edit it.")}</Text>
                {steps.map((step) => (
                  <View key={step.id} style={styles.step}>
                    <TouchableOpacity style={styles.checkTarget} onPress={() => toggleSelect(step.id)}
                      disabled={isApplying} accessibilityRole="checkbox"
                      accessibilityState={{ checked: step.isSelected, disabled: isApplying }}
                      accessibilityLabel={t(`Chọn bước · ${step.title}`, `Select step · ${step.title}`)}>
                      <View style={[styles.box, step.isSelected && styles.boxChecked]}>
                        {step.isSelected && <Text style={styles.check}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.editor}>
                      <TextInput multiline value={step.title} onChangeText={(value) => updateTitle(step.id, value)}
                        placeholder={t("Tên bước", "Step name")} placeholderTextColor={colors.muted} editable={!isApplying}
                        accessibilityLabel={t(`Sửa bước ${steps.indexOf(step) + 1}`, `Edit step ${steps.indexOf(step) + 1}`)} maxLength={255}
                        style={[styles.input, !step.isSelected && styles.unselected]} />
                      <Text style={styles.stepLabel}>{step.id === starter?.id ? starter.estimatedMinutes : step.estimatedMinutes} {t('phút', 'min')}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
            {blockedBy && (
              <View style={styles.preview}>
                <Text style={styles.muted}>{t(`Bạn đang làm “${blockedBy.title}”.`, `You’re working on “${blockedBy.title}”.`)}</Text>
                <ActionButton label={t('Tiếp tục việc đang làm')} variant="secondary" disabled={isApplying}
                  onPress={async () => { if (await onStartFocus(blockedBy.id)) onClose(); }} />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {starter && !valid && !isLoading && (
              <Text style={styles.feedback}>{t("Hãy điền tên cho các bước bạn chọn.", "Name each selected step.")}</Text>
            )}
            {saveError && <Text style={styles.feedback} accessibilityLiveRegion="polite">{saveError}</Text>}
            {confirmAction ? (
              <>
                <Text style={styles.feedback} accessibilityLiveRegion="polite">{t("Thay các bước sẽ đặt lại tiến độ đã tick.", "Replacing these steps will reset checklist progress.")}</Text>
                <ActionButton label={t("Thay các bước", "Replace steps")} onPress={() => void handleApply(confirmAction, true)} />
                <ActionButton label={t("Giữ các bước cũ", "Keep existing steps")} variant="quiet" onPress={() => setConfirmAction(null)} />
              </>
            ) : (
              <>
                {!blockedBy && <ActionButton label={isApplying ? t("Đang lưu…", "Saving…") : t('Bắt đầu bước này')}
                  disabled={!canSubmit} onPress={() => void handleApply('start')} />}
                <ActionButton label={t("Lưu để làm sau", "Save for later")} variant="quiet" disabled={!canSubmit}
                  onPress={() => void handleApply('save')} />
              </>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 6, 23, 0.72)' },
  sheet: { maxHeight: '96%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 8 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  body: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  preview: { backgroundColor: colors.canvas, padding: 12, borderRadius: 12, gap: 4 },
  previewTitle: { color: colors.text, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, borderColor: colors.border, paddingVertical: 4 },
  checkTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: colors.accentInk, fontSize: 14, fontWeight: '700' },
  editor: { flex: 1 },
  input: { minHeight: 44, color: colors.text, fontSize: 15, lineHeight: 21, paddingVertical: 8 },
  unselected: { color: colors.muted, textDecorationLine: 'line-through' },
  stepLabel: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  footer: { borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  feedback: { color: colors.warning, fontSize: 14, lineHeight: 20 },
  skeleton: { height: 44, borderRadius: 10, backgroundColor: colors.border },
});
