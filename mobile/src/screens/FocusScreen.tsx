import { useLocale } from '../ui/locale';
import React, { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FocusTimer } from '../components/FocusTimer';
import { FocusSessionService } from '../services/api';
import { FocusTimerState, useFocusStore } from '../store/useFocusStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTaskStore } from '../store/useTaskStore';
import { ActionButton, LanguageButton } from '../ui/Controls';
import { colors } from '../ui/theme';
import { Subtask, Task } from '../types';

interface FocusScreenProps {
  doingTask: Task | null;
  onExitFocus: () => void;
  onCompleteTask: (taskId: string) => Promise<boolean>;
  onToggleSubtask: (taskId: string, subtaskId: string) => Promise<boolean>;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  doingTask,
  onExitFocus,
  onCompleteTask,
  onToggleSubtask,
}) => {
  const t = useLocale();
  const focus = useFocusStore();
  const pomodoroMinutes = useSettingsStore((state) => state.pomodoroMinutes);
  const busy = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!doingTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerName}>{t('Tập trung')}</Text><LanguageButton /></View>
        <View style={styles.empty}>
          <Text style={styles.title}>{t("Chưa có việc đang làm", "No task in progress")}</Text>
          <ActionButton label={t("Quay lại", "Back")} onPress={onExitFocus} />
        </View>
      </SafeAreaView>
    );
  }

  const session = focus.session?.taskId === doingTask.id ? focus.session : null;
  const steps = [...doingTask.subtasks].sort((a, b) => a.stepOrder - b.stepOrder);
  const completed = steps.filter((step) => step.isCompleted).length;
  const activeStep = steps.find((step) => step.id === session?.stepId && !step.isCompleted)
    ?? steps.find((step) => !step.isCompleted);
  const canTimeStep = !!activeStep && activeStep.estimatedMinutes >= 1 && activeStep.estimatedMinutes <= 20;
  const shortSession = session?.mode === 'step' && canTimeStep;
  const minutes = shortSession && activeStep ? activeStep.estimatedMinutes : pomodoroMinutes;
  const timer = session?.timer;
  const timerInProgress = timer != null && (timer.endsAt !== null || timer.remainingSeconds > 0);

  const finishSession = (finished: FocusTimerState) => {
    const current = useFocusStore.getState();
    if (current.session?.taskId !== doingTask.id || current.session.timer !== finished) return;
    current.setTimer({ ...finished, remainingSeconds: 0, endsAt: null });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!shortSession) {
      FocusSessionService.logSession({
        taskId: doingTask.id,
        durationMinutes: finished.minutes,
        isCompleted: true,
      }).then(() => useTaskStore.getState().fetchStreak())
        .catch(() => useTaskStore.getState().showToast(t("Phiên đã kết thúc. Orbit chưa ghi nhận được phiên này.", "Your session ended. Orbit could not log it."), 'info'));
    }
  };

  const saveAction = async (step?: Subtask) => {
    if (busy.current) return;
    busy.current = true;
    setIsSubmitting(true);
    try {
      if (!step) {
        if (await onCompleteTask(doingTask.id)) {
          focus.clear();
          onExitFocus();
        }
        return;
      }
      if (await onToggleSubtask(doingTask.id, step.id) && !step.isCompleted && step.id === activeStep?.id) {
        const next = steps.find((item) => !item.isCompleted && item.id !== step.id);
        focus.advance(next?.id);
      }
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={onExitFocus} accessibilityRole="button"
          accessibilityLabel={t("Tạm dừng và quay lại", "Pause and go back")}>
          <Text style={styles.backLabel}>{t("‹ Quay lại", "‹ Back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerName}>{t('Tập trung')}</Text>
        <LanguageButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>{activeStep ? doingTask.title : t("Việc đang làm", "Task in progress")}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {activeStep?.title ?? doingTask.title}
          </Text>
          {steps.length > 0 && (
            <Text style={[styles.label, completed > 0 && styles.success]} accessibilityLiveRegion="polite">
              {t(`${completed}/${steps.length} bước đã xong`, `${completed}/${steps.length} steps done`)}
            </Text>
          )}

          <FocusTimer initialMinutes={minutes} timer={timer} checklistProgress={steps.length ? completed / steps.length : undefined}
            onChange={focus.setTimer} onComplete={finishSession} />
          {timer?.remainingSeconds === 0 && timer.endsAt === null && (
            <Text style={styles.notice} accessibilityLiveRegion="polite">{t(`Phiên ${timer.minutes} phút đã kết thúc.`, `Your ${timer.minutes}-minute session ended.`)}</Text>
          )}
          <ActionButton label={activeStep ? t("Xong bước này", "Finish this step") : t('Hoàn thành việc')}
            onPress={() => void saveAction(activeStep)} disabled={isSubmitting} />
        </View>

        {canTimeStep && !timerInProgress && activeStep && (
          <ActionButton variant="quiet"
            label={shortSession ? t(`Dùng phiên ${pomodoroMinutes} phút`, `Use a ${pomodoroMinutes}-minute session`) : t(`Dùng ${activeStep.estimatedMinutes} phút cho bước này`, `Use ${activeStep.estimatedMinutes} min for this step`)}
            onPress={() => focus.selectMode(shortSession ? 'pomodoro' : 'step')} />
        )}

        {steps.length > 0 && (
          <View style={styles.checklist}>
            <Text style={styles.section}>{t('Các bước nhỏ')}</Text>
            {steps.map((step) => (
              <TouchableOpacity key={step.id} style={[styles.step, step.id === activeStep?.id && styles.activeStep]}
                onPress={() => void saveAction(step)} disabled={isSubmitting} accessibilityRole="checkbox"
                accessibilityState={{ checked: step.isCompleted, disabled: isSubmitting }}>
                <Text style={[styles.check, step.isCompleted && styles.checked]}>{step.isCompleted ? '✓' : ''}</Text>
                <Text style={styles.stepText}>{step.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeStep && (
          <ActionButton variant="quiet" label={t('Hoàn thành việc')} onPress={() => void saveAction()} disabled={isSubmitting} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  empty: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  header: { flexDirection: 'row', minHeight: 48, alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 },
  headerName: { color: colors.muted, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  back: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingVertical: 8, flexShrink: 1 },
  backLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8, gap: 8 },
  card: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 8 },
  checklist: { padding: 8, gap: 8 },
  label: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  success: { color: colors.success },
  title: { color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5 },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 8 },
  notice: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  step: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 8, gap: 12 },
  activeStep: { backgroundColor: colors.surface },
  stepText: { flex: 1, color: colors.text, fontSize: 15 },
  check: { width: 22, height: 22, color: colors.accentInk, borderColor: colors.muted, borderWidth: 1, borderRadius: 6, textAlign: 'center', fontWeight: '700' },
  checked: { backgroundColor: colors.success, borderColor: colors.success },
});
