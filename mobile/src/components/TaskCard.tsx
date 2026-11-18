import { useEnergyLabels, useLocale } from '../ui/locale';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Task, TaskStatus } from '../types';
import { colors } from '../ui/theme';

interface TaskCardProps {
  task: Task;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onFocusTask: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  isDimmed?: boolean;
  triggerRollback?: boolean;
}

export const TaskCard = React.memo(function TaskCard({
  task, onMoveTask, onFocusTask, onOpenDetail, isDimmed, triggerRollback,
}: TaskCardProps) {
  const t = useLocale();
  const energyLabels = useEnergyLabels();
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!triggerRollback) return;
    translate.setValue(-12);
    const rollback = Animated.spring(translate, {
      toValue: 0, damping: 15, stiffness: 120, mass: 1, useNativeDriver: true,
    });
    rollback.start();
    return () => rollback.stop();
  }, [translate, triggerRollback]);

  const completedSteps = task.subtasks.filter((step) => step.isCompleted).length;
  const meta = [
    task.estimatedMinutes ? t(`${task.estimatedMinutes} phút`, `${task.estimatedMinutes} min`) : '',
    task.subtasks.length ? t(`${completedSteps}/${task.subtasks.length} bước`, `${completedSteps}/${task.subtasks.length} steps`) : '',
    energyLabels[task.energyRequired],
  ].filter(Boolean).join('  ·  ');

  const actions = task.status === 'DOING' ? [
    { label: t('Tiếp tục'), onPress: () => onFocusTask(task) },
    { label: t("Đưa về Chờ làm", "Move to Waiting"), onPress: () => onMoveTask(task.id, 'TODO') },
    { label: t("Hoàn thành", "Complete"), onPress: () => onMoveTask(task.id, 'DONE') },
  ] : task.status === 'DONE' ? [
    { label: t('Mở lại'), onPress: () => onMoveTask(task.id, 'TODO') },
  ] : [
    { label: t('Xem bước tiếp theo', 'See next step'), onPress: () => onOpenDetail(task) },
  ];

  return (
    <Animated.View style={[styles.card, isDimmed && styles.deprioritized, { transform: [{ translateX: translate }] }]}>
      <Pressable style={styles.details} accessibilityRole="button" accessibilityLabel={t(`Mở chi tiết · ${task.title}`, `Open details · ${task.title}`)}
        onPress={() => onOpenDetail(task)}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </Pressable>
      <View style={styles.actions}>
        {actions.map(({ label, onPress }) => (
          <Pressable key={label} onPress={onPress} style={styles.button} accessibilityRole="button"
            accessibilityLabel={`${label} · ${task.title}`}>
            <Text style={styles.buttonText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8 },
  deprioritized: { backgroundColor: colors.canvas, borderStyle: 'dashed' },
  details: { minHeight: 44, padding: 4, gap: 4, justifyContent: 'center' },
  title: { fontSize: 16, lineHeight: 23, color: colors.text, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 4 },
  buttonText: { fontSize: 13, color: colors.text, fontWeight: '600' },
});
