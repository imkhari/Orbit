import React, { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Task, Subtask, TaskStatus, UrgencyLevel } from '../types';
import { ActionButton, ChoiceSheet, ScreenHeader } from '../ui/Controls';
import { useEnergyLabels, useLocale } from '../ui/locale';
import { colors, energyLevels } from '../ui/theme';

export interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  doingTask: Task | null;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<void>;
  onMoveTask: (id: string, status: TaskStatus) => Promise<boolean>;
  onToggleSubtask: (id: string, stepId: string) => Promise<boolean>;
  onApplySubtasks: (id: string, steps: Subtask[]) => Promise<Task | null>;
  onOpenAIDecompose: (task: Task) => void;
  onStartFocus: (id: string, step?: Subtask) => Promise<boolean>;
}

type Draft = Pick<Task, 'title' | 'description' | 'energyRequired' | 'urgency'>;
const urgencyLevels: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function TaskDetailModal({ visible, task, doingTask, onClose, onUpdateTask, onDeleteTask,
  onMoveTask, onToggleSubtask, onApplySubtasks, onOpenAIDecompose, onStartFocus }: TaskDetailModalProps) {
  const t = useLocale();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [stepTitle, setStepTitle] = useState('');
  const [stepMinutes, setStepMinutes] = useState('5');
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const energyNames = useEnergyLabels();
  if (!task) return null;

  const steps = [...task.subtasks].sort((a, b) => a.stepOrder - b.stepOrder);
  const next = steps.find((step) => !step.isCompleted);
  const done = task.status === 'DONE';
  const active = task.status === 'DOING';
  const other = doingTask && doingTask.id !== task.id ? doingTask : null;
  const back = () => {
    if (running.current) return;
    if (confirmDelete) setConfirmDelete(false);
    else if (draft) { Keyboard.dismiss(); setDraft(null); }
    else onClose();
  };
  const run = async (action: () => Promise<unknown>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFailure(false);
    try { await action(); }
    finally { running.current = false; setBusy(false); }
  };
  const start = (id: string, step?: Subtask) => run(async () => {
    if (await onStartFocus(id, step)) onClose();
    else setFailure(true);
  });
  const changeStatus = (status: TaskStatus) => run(async () => {
    setFailure(!await onMoveTask(task.id, status));
  });
  const remove = () => void run(async () => {
    await onDeleteTask(task.id);
    onClose();
  });
  const saveDraft = () => {
    if (!draft || !validDraft) return;
    Keyboard.dismiss();
    void run(async () => {
      const title = draft.title.trim();
      const description = draft.description?.trim() ?? '';
      const saved = await onUpdateTask(task.id, {
        ...draft, title: title === task.title ? undefined : title,
        description: description === (task.description ?? '') ? undefined : description,
      });
      if (saved) setDraft(null);
      else setFailure(true);
    });
  };
  const validDraft = !!draft && (draft.title.trim() === task.title || draft.title.trim().length >= 2);
  const minutes = Number(stepMinutes);
  const validStep = !!stepTitle.trim() && Number.isInteger(minutes) && minutes >= 1 && minutes <= 20;
  const saveStep = () => {
    if (!validStep) return;
    Keyboard.dismiss();
    void run(async () => {
      const step: Subtask = { id: '', taskId: task.id, title: stepTitle.trim(), estimatedMinutes: minutes,
        stepOrder: steps.length + 1, energyLevel: task.energyRequired, isCompleted: false };
      if (!await onApplySubtasks(task.id, [...steps, step])) { setFailure(true); return; }
      setAddingStep(false);
      setStepTitle('');
      setStepMinutes('5');
    });
  };
  const openEditor = () => {
    setDraft({ title: task.title, description: task.description, energyRequired: task.energyRequired, urgency: task.urgency });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const status = done ? t('Đã xong') : active ? t('Đang làm') : t('Chờ làm');
  const urgencyNames = { LOW: t('Thảnh thơi', 'Low'), MEDIUM: t('Bình thường', 'Normal'),
    HIGH: t('Gấp', 'High'), CRITICAL: t('Rất gấp', 'Urgent') };
  const action = active ? { label: t('Tiếp tục'), press: () => void start(task.id) }
    : other ? { label: t('Tiếp tục việc đang làm'), press: () => void start(other.id) }
    : next ? { label: t('Bắt đầu bước này'), press: () => void start(task.id, next) }
    : steps.length ? { label: t('Hoàn thành việc'), press: () => void changeStatus('DONE') }
    : { label: t('Chia nhỏ việc', 'Break down task'), press: () => onOpenAIDecompose(task) };

  return (
    <Modal visible={visible} animationType="none" onRequestClose={back}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.top}>
            <ScreenHeader title={confirmDelete ? t('Xóa việc?', 'Delete task?')
              : draft ? t('Chỉnh sửa việc', 'Edit task') : t('Chi tiết việc', 'Task details')} onClose={back} />
          </View>
          <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {confirmDelete ? (
              <View style={styles.panel}>
                <Text style={styles.stepTitle}>{task.title}</Text>
                <Text style={styles.warning}>{t('Việc và các bước của nó sẽ bị xóa.', 'This task and its steps will be deleted.')}</Text>
                <ActionButton label={t('Xóa việc', 'Delete task')} variant="secondary" disabled={busy} onPress={remove} />
                <ActionButton label={t('Hủy')} variant="quiet" disabled={busy} onPress={back} />
              </View>
            ) : draft ? (
              <View style={styles.panel}>
                <Text style={styles.label}>{t('Tên việc')}</Text>
                <TextInput style={styles.input} accessibilityLabel={t('Tên việc')} maxLength={255}
                  value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} editable={!busy} />
                <Text style={styles.label}>{t('Ghi chú')}</Text>
                <TextInput style={[styles.input, styles.notes]} multiline maxLength={2000} editable={!busy}
                  accessibilityLabel={t('Ghi chú')} value={draft.description ?? ''}
                  onChangeText={(description) => setDraft({ ...draft, description })} />
                <Text style={styles.label}>{t('Năng lượng cần', 'Energy required')}</Text>
                <View style={styles.options}>
                  {energyLevels.map((energyRequired) => <Option key={energyRequired} label={energyNames[energyRequired]}
                    selected={draft.energyRequired === energyRequired} onPress={() => setDraft({ ...draft, energyRequired })} />)}
                </View>
                <Text style={styles.label}>{t('Độ khẩn cấp', 'Urgency')}</Text>
                <View style={styles.options}>
                  {urgencyLevels.map((urgency) => <Option key={urgency} label={urgencyNames[urgency]}
                    selected={draft.urgency === urgency} onPress={() => setDraft({ ...draft, urgency })} />)}
                </View>
                {!validDraft && <Text style={styles.warning}>{t('Tên việc cần ít nhất 2 ký tự.', 'Use at least 2 characters for the task name.')}</Text>}
                <ActionButton label={t('Lưu')} disabled={busy || !validDraft} onPress={saveDraft} />
                <ActionButton label={t('Hủy')} variant="quiet" disabled={busy} onPress={back} />
              </View>
            ) : (
              <>
                <Text style={[styles.label, done && styles.success]}>{status}</Text>
                <Text style={styles.heading} accessibilityRole="header">{task.title}</Text>
                <View style={styles.panel}>
                  {done ? (
                    <ActionButton variant="secondary" label={t('Mở lại')} disabled={busy}
                      onPress={() => void changeStatus('TODO')} />
                  ) : (
                    <>
                      <Text style={styles.label}>{t('Bước tiếp theo')}</Text>
                      {!active && other ? <Text style={styles.stepTitle}>{other.title}</Text>
                        : next ? (
                          <>
                            <Text style={styles.stepTitle}>{next.title}</Text>
                            <Text style={styles.muted}>{t(`${next.estimatedMinutes} phút`, `${next.estimatedMinutes} min`)}</Text>
                          </>
                        ) : steps.length > 0 && <Text style={styles.muted}>{t('Bạn đã xong mọi bước.', 'You finished every step.')}</Text>}
                      <ActionButton label={action.label} onPress={action.press} disabled={busy} />
                    </>
                  )}
                </View>
                <View style={styles.panel}>
                  <Text style={styles.stepTitle}>{t('Các bước nhỏ')}</Text>
                  <Text style={styles.muted}>{steps.length
                    ? t(`${steps.filter((step) => step.isCompleted).length}/${steps.length} bước đã xong`, `${steps.filter((step) => step.isCompleted).length}/${steps.length} steps done`)
                    : t('Chưa có bước nào', 'No steps yet')}</Text>
                  {steps.map((step) => (
                    <View key={step.id} style={styles.stepRow}>
                      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: step.isCompleted, disabled: busy }}
                        disabled={busy} style={styles.step} onPress={() => void run(async () => setFailure(!await onToggleSubtask(task.id, step.id)))}>
                        <Text style={[styles.check, step.isCompleted && styles.success]}>{step.isCompleted ? '✓' : ''}</Text>
                        <Text style={styles.stepText}>{step.title}</Text>
                      </Pressable>
                      <Pressable style={styles.remove} accessibilityRole="button" disabled={busy}
                        accessibilityLabel={t(`Xóa bước ${step.title}`, `Remove step ${step.title}`)}
                        onPress={() => void run(async () => setFailure(!await onApplySubtasks(task.id, steps.filter((item) => item.id !== step.id))))}>
                        <Text style={styles.muted}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                  {!done && (addingStep ? (
                    <>
                      <TextInput style={styles.input} value={stepTitle} onChangeText={setStepTitle}
                        placeholder={t('Tên bước', 'Step name')} placeholderTextColor={colors.muted}
                        accessibilityLabel={t('Tên bước', 'Step name')} maxLength={255} editable={!busy} />
                      <TextInput style={styles.input} value={stepMinutes} onChangeText={setStepMinutes} keyboardType="number-pad"
                        accessibilityLabel={t('Thời lượng 1–20 phút', 'Duration 1–20 minutes')} maxLength={2} editable={!busy} />
                      <ActionButton label={t('Lưu bước', 'Save step')} onPress={saveStep} disabled={busy || !validStep} />
                      <ActionButton label={t('Hủy')} variant="quiet" disabled={busy} onPress={() => { Keyboard.dismiss(); setAddingStep(false); }} />
                    </>
                  ) : <ActionButton label={t('Thêm bước thủ công', 'Add a step')} variant="secondary" icon="plus"
                    disabled={busy} onPress={() => setAddingStep(true)} />)}
                </View>
                {!!task.description && <View style={styles.panel}><Text style={styles.label}>{t('Ghi chú')}</Text>
                  <Text style={styles.stepText}>{task.description}</Text></View>}
                <ActionButton label={t('Chỉnh sửa việc', 'Edit task')} variant="secondary" disabled={busy} onPress={openEditor} />
                <ActionButton label={t('Thao tác khác', 'More actions')} variant="quiet" disabled={busy} onPress={() => setMenu(true)} />
              </>
            )}
            {failure && <Text style={styles.warning} accessibilityLiveRegion="polite">{t('Chưa cập nhật được. Bạn có thể thử lại.', 'Could not update. Try again.')}</Text>}
          </ScrollView>
          {menu && <ChoiceSheet title={t('Thao tác khác', 'More actions')} selected="" choices={[
            ...(!done && steps.length ? [{ id: 'breakdown', label: t('Gợi ý lại các bước', 'Suggest new steps') }] : []),
            { id: 'delete', label: t('Xóa việc', 'Delete task') },
          ]} onSelect={(choice) => {
            setMenu(false);
            if (choice === 'delete') { setConfirmDelete(true); scroll.current?.scrollTo({ y: 0, animated: false }); }
            else onOpenAIDecompose(task);
          }} onClose={() => setMenu(false)} />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}
    style={[styles.option, selected && styles.selected]}><Text style={[styles.label, selected && styles.accent]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  top: { paddingHorizontal: 12, paddingBottom: 8, borderBottomColor: colors.border, borderBottomWidth: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  heading: { color: colors.text, fontSize: 30, lineHeight: 37, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  warning: { color: colors.warning, fontSize: 14 },
  success: { color: colors.success },
  accent: { color: colors.accent },
  panel: { padding: 14, gap: 10, borderRadius: 16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  stepTitle: { color: colors.text, fontSize: 19, lineHeight: 26, fontWeight: '700' },
  stepText: { flexShrink: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  stepRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  step: { flex: 1, minHeight: 48, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { height: 24, width: 24, textAlign: 'center', borderRadius: 6, borderWidth: 1, borderColor: colors.outline },
  remove: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.canvas,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text },
  notes: { minHeight: 100, textAlignVertical: 'top' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minWidth: 48, minHeight: 48, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.outline, justifyContent: 'center' },
  selected: { borderColor: colors.accent },
});
