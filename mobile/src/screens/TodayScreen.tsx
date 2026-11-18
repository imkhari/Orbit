import { useEnergyLabels, useLocale } from '../ui/locale';
import React, { useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIDecomposeModal } from '../components/AIDecomposeModal';
import { RescueModal } from '../components/RescueModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { formatTimer, secondsRemaining, useFocusStore } from '../store/useFocusStore';
import { useBoardStore } from '../store/useBoardStore';
import { EnergyLevel, Subtask, Task } from '../types';
import { ActionButton, ChoiceSheet, LanguageButton } from '../ui/Controls';
import { OrbitIcon } from '../ui/OrbitIcon';
import { colors, energyLevels } from '../ui/theme';

interface TodayProps {
  tasks: Task[];
  doingTask: Task | null;
  energy: EnergyLevel;
  isLoading: boolean;
  hasLoadError: boolean;
  onEnergyChange: (energy: EnergyLevel) => void;
  onRetry: () => void;
  onCreate: (title: string, energy: EnergyLevel, description?: string, boardId?: string) => Task | null;
  onApplySubtasks: (id: string, steps: Subtask[]) => Promise<Task | null>;
  onStartFocus: (id: string, step?: Subtask) => Promise<boolean>;
  onUpdateTask: React.ComponentProps<typeof TaskDetailModal>['onUpdateTask'];
  onDeleteTask: React.ComponentProps<typeof TaskDetailModal>['onDeleteTask'];
  onMoveTask: React.ComponentProps<typeof TaskDetailModal>['onMoveTask'];
  onToggleSubtask: React.ComponentProps<typeof TaskDetailModal>['onToggleSubtask'];
}

export function TodayScreen({
  tasks, doingTask, energy, isLoading, hasLoadError, onEnergyChange, onRetry,
  onCreate, onApplySubtasks, onStartFocus,
  onUpdateTask, onDeleteTask, onMoveTask, onToggleSubtask,
}: TodayProps) {
  const t = useLocale();
  const energyLabels = useEnergyLabels();
  const energyChoices = energyLevels.map((id) => ({ id, label: energyLabels[id] }));
  const captureLabel = t("Ghi một việc", "Capture a task");
  const { boards, activeBoardId } = useBoardStore();
  const session = useFocusStore((state) => state.session);
  const [energyOpen, setEnergyOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [capturedId, setCapturedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Task | null>(null);
  const [rescueOpen, setRescueOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const pending = tasks.filter((task) => (task.status === 'BACKLOG' || task.status === 'TODO')
    && !boards.some((board) => board.id === task.boardId && board.isArchived))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const candidate = pending.find((task) => task.boardId === activeBoardId) ?? pending[0];
  const detail = tasks.find((task) => task.id === detailId || task.clientId === detailId);
  const captured = pending.find((task) => task.id === capturedId || task.clientId === capturedId);
  const capturedStep = captured?.subtasks.filter((step) => !step.isCompleted).sort((a, b) => a.stepOrder - b.stepOrder)[0];
  const activeSession = doingTask && session?.taskId === doingTask.id ? session : null;
  const steps = [...(doingTask?.subtasks ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
  const activeStep = steps.find((step) => step.id === activeSession?.stepId && !step.isCompleted)
    ?? steps.find((step) => !step.isCompleted);
  const timer = activeSession?.timer;
  const timerText = timer && secondsRemaining(timer) > 0 ? t(`${formatTimer(secondsRemaining(timer))} còn lại`, `${formatTimer(secondsRemaining(timer))} left`) : null;
  const today = new Date();
  const completedToday = tasks.filter((task) => task.status === 'DONE' && task.completedAt
    && new Date(task.completedAt).toDateString() === today.toDateString()).length;

  const submit = () => {
    const task = onCreate(title, energy, undefined, activeBoardId ?? undefined);
    if (!task) return;
    Keyboard.dismiss();
    setCapturedId(task.id);
    setTitle('');
    setCaptureOpen(false);
  };

  const hero = doingTask ? {
    label: t('Bước tiếp theo'),
    title: activeStep?.title ?? doingTask.title,
    context: activeStep ? doingTask.title : undefined,
    meta: [timerText ?? (activeStep ? t(`${activeStep.estimatedMinutes} phút`, `${activeStep.estimatedMinutes} min`) : null),
      activeStep ? t(`Bước ${steps.indexOf(activeStep) + 1}/${steps.length}`, `Step ${steps.indexOf(activeStep) + 1}/${steps.length}`) : null].filter(Boolean).join('  ·  '),
    button: t('Tiếp tục'),
    action: () => void onStartFocus(doingTask.id),
  } : captured ? {
    label: capturedStep ? t('Bước tiếp theo') : t("Việc vừa ghi", "Just captured"),
    title: capturedStep?.title ?? captured.title,
    context: capturedStep ? captured.title : undefined,
    meta: capturedStep ? t(`${capturedStep.estimatedMinutes} phút`, `${capturedStep.estimatedMinutes} min`) : undefined,
    button: capturedStep ? t('Bắt đầu bước này') : t("Chia thành các bước nhỏ", "Break down task"),
    action: () => capturedStep ? void onStartFocus(captured.id, capturedStep) : setProposal(captured),
  } : hasLoadError ? {
    label: t("Kết nối", "Connection"),
    title: t("Chưa tải được việc", "Could not load tasks"),
    context: t("Thử kết nối lại để xem việc của bạn.", "Reconnect to see your tasks."),
    button: t('Thử lại'),
    action: onRetry,
  } : candidate ? {
    title: t("Gợi ý một việc vừa sức", "Find a manageable task"),
    context: t("Orbit có thể chọn giúp bạn một bước để bắt đầu.", "Orbit can suggest a step to get you started."),
    button: t("Xem gợi ý", "See suggestion"),
    action: () => setRescueOpen(true),
  } : {
    title: completedToday ? t(`Bạn đã xong ${completedToday} việc`, `You finished ${completedToday} ${completedToday === 1 ? 'task' : 'tasks'}`) : t("Bạn muốn bắt đầu việc gì?", "What would you like to start?"),
    context: completedToday ? t("Ghi thêm khi có việc mới.", "Capture another task when you're ready.") : t("Ghi tên một việc đang ở trong đầu bạn.", "Write down one task that's on your mind."),
    button: captureLabel,
    action: () => setCaptureOpen(true),
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <OrbitIcon name="today" color={colors.accent} size={24} />
          <Text style={styles.brandText}>Orbit</Text>
        </View>
        <LanguageButton />
      </View>
      <FlatList data={pending} keyExtractor={(task) => task.clientId ?? task.id}
        contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<>

        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.headingTitle}>{t('Hôm nay')}</Text>
          <View style={styles.topRow}>
            <Text style={[styles.subtle, styles.date]}>{today.toLocaleDateString(t('vi-VN', 'en-US'), { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${t("Năng lượng", "Energy")} · ${energyLabels[energy]}`}
              style={styles.energy} onPress={() => setEnergyOpen(true)}>
              <Text style={styles.energyText}>{t("Năng lượng", "Energy")} · {energyLabels[energy]}</Text>
              <OrbitIcon name="chevron" size={16} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {captureOpen ? (
          <View style={styles.hero}>
            <Text style={styles.title}>{t("Ghi một việc", "Capture a task")}</Text>
            <TextInput accessibilityLabel={t('Tên việc')} placeholder={t("Bạn muốn làm gì?", "What would you like to do?")}
              placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} autoFocus
              onSubmitEditing={submit} returnKeyType="done" style={styles.input} />
            <ActionButton label={t("Lưu việc", "Save task")} onPress={submit} disabled={!title.trim()} />
            <ActionButton variant="quiet" label={t('Hủy')} onPress={() => { Keyboard.dismiss(); setCaptureOpen(false); }} />
          </View>
        ) : isLoading && !doingTask && !tasks.length ? (
          <View style={styles.hero} accessibilityLiveRegion="polite">
            <Text style={styles.title}>{t("Đang tải việc…", "Loading tasks…")}</Text>
            <View style={styles.skeleton} />
            <View style={[styles.skeleton, styles.shortSkeleton]} />
          </View>
        ) : (
          <View style={styles.hero}>
            <View style={styles.orbitArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.orbitOuter} />
              <View style={styles.orbitInner} />
              <View style={styles.orbitDot} />
            </View>
            {hero.label && <Text style={styles.eyebrow}>{hero.label}</Text>}
            <Text accessibilityRole="header" style={styles.title}>{hero.title}</Text>
            {hero.context && <Text style={styles.subtle}>{hero.context}</Text>}
            {hero.meta ? <Text style={styles.meta}>{hero.meta}</Text> : null}
            <View style={styles.heroAction}>
              <ActionButton label={hero.button} onPress={hero.action} icon={hero.button === captureLabel ? 'plus' : 'arrow'} />
            </View>
          </View>
        )}

        {!captureOpen && hero.button !== captureLabel && (
          <View style={styles.extra}>
            <ActionButton variant="secondary" icon="plus" label={t("Ghi một việc", "Capture a task")} onPress={() => setCaptureOpen(true)} />
          </View>
        )}
        {pending.length > 0 && <Text accessibilityRole="header" style={styles.listHeading}>{t("Việc đang chờ", "Waiting tasks")}</Text>}
        </>}
        renderItem={({ item }) => (
          <Pressable style={styles.taskRow} accessibilityRole="button"
            accessibilityLabel={t(`Mở chi tiết · ${item.title}`, `Open details · ${item.title}`)}
            onPress={() => setDetailId(item.clientId ?? item.id)}>
            <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
            <OrbitIcon name="arrow" color={colors.muted} size={18} />
          </Pressable>
        )}
      />

      {energyOpen && <ChoiceSheet title={t("Năng lượng hiện tại", "Current energy")} selected={energy}
        choices={energyChoices} onSelect={onEnergyChange} onClose={() => setEnergyOpen(false)} />}
      <RescueModal visible={rescueOpen} onClose={() => setRescueOpen(false)}
        onStartFocus={onStartFocus} currentEnergy={energy} activeBoardId={candidate?.boardId} />
      <AIDecomposeModal visible={!!proposal} task={proposal} onClose={() => setProposal(null)}
        doingTask={doingTask} onApplySubtasks={onApplySubtasks} onStartFocus={onStartFocus} />
      <TaskDetailModal key={detail?.clientId ?? detail?.id} visible={!!detail && !proposal} task={detail ?? null} doingTask={doingTask}
        onClose={() => setDetailId(null)} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask}
        onMoveTask={onMoveTask} onToggleSubtask={onToggleSubtask} onApplySubtasks={onApplySubtasks}
        onOpenAIDecompose={setProposal}
        onStartFocus={onStartFocus} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  top: { flexDirection: 'row', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontSize: 19, color: colors.text, fontWeight: '800', letterSpacing: -0.4 },
  energy: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  energyText: { color: colors.text, fontSize: 13, flexShrink: 1 },
  heading: { marginTop: 24, marginBottom: 16, gap: 4 },
  date: { flexShrink: 1 },
  headingTitle: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2 },
  subtle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  hero: { padding: 20, gap: 8, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { color: colors.accent, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  title: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: '700', letterSpacing: -0.55 },
  meta: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 4, fontWeight: '600' },
  heroAction: { marginTop: 12 },
  extra: { marginTop: 16 },
  listHeading: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface },
  taskTitle: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  orbitArt: { alignSelf: 'flex-end', width: 56, height: 48, marginBottom: 4 },
  orbitOuter: { position: 'absolute', width: 48, height: 48, left: 4, borderWidth: 1, borderColor: colors.outline, borderRadius: 24 },
  orbitInner: { position: 'absolute', width: 32, height: 32, top: 8, left: 12, borderWidth: 1, borderColor: colors.outline, borderRadius: 16 },
  orbitDot: { position: 'absolute', backgroundColor: colors.accent, width: 7, height: 7, borderRadius: 4, left: 46, top: 10 },
  input: { minHeight: 50, color: colors.text, backgroundColor: colors.canvas, borderColor: colors.outline, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginVertical: 4 },
  skeleton: { height: 12, width: '82%', borderRadius: 6, backgroundColor: colors.border },
  shortSkeleton: { width: '56%' },
});
