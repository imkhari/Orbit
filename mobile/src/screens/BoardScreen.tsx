import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIDecomposeModal } from '../components/AIDecomposeModal';
import { BoardSwitcherModal } from '../components/BoardSwitcherModal';
import { QuickCaptureBar } from '../components/QuickCaptureBar';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useBoardStore } from '../store/useBoardStore';
import { useTaskStore } from '../store/useTaskStore';
import { EnergyLevel, Subtask, Task, TaskStatus } from '../types';
import { ChoiceSheet, ScreenHeader } from '../ui/Controls';
import { useEnergyLabels, useLocale } from '../ui/locale';
import { OrbitIcon } from '../ui/OrbitIcon';
import { colors, energyLevels } from '../ui/theme';

interface BoardScreenProps {
  tasks: Task[];
  onMoveTask: (id: string, status: TaskStatus) => Promise<boolean>;
  onQuickAdd: (title: string, energy: EnergyLevel, description?: string, boardId?: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<void>;
  onApplySubtasks: (id: string, steps: Subtask[]) => Promise<Task | null>;
  onToggleSubtask: (id: string, stepId: string) => Promise<boolean>;
  onFocusTask: (id: string, step?: Subtask) => Promise<boolean>;
  rollbackTaskId?: string | null;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
}

type Column = 'WAITING' | 'DOING' | 'DONE';
type Filter = EnergyLevel | 'ALL';
export type BoardView = { column: Column; filter: Filter };
const isInColumn = (task: Task, column: Column) => column === 'WAITING'
  ? task.status === 'BACKLOG' || task.status === 'TODO' : task.status === column;

export function BoardScreen({
  tasks, onMoveTask, onQuickAdd, onUpdateTask, onDeleteTask,
  onApplySubtasks, onToggleSubtask, onFocusTask, rollbackTaskId, view, onViewChange,
}: BoardScreenProps) {
  const t = useLocale();
  const columns: { id: Column; label: string; empty: string }[] = [
    { id: 'WAITING', label: t('Chờ làm'), empty: t('Chưa có việc đang chờ', 'No waiting tasks') },
    { id: 'DOING', label: t('Đang làm'), empty: t('Chưa có việc đang làm', 'No task in progress') },
    { id: 'DONE', label: t('Đã xong'), empty: t('Chưa có việc hoàn thành', 'No completed tasks') },
  ];
  const energyNames = useEnergyLabels();
  const filters: { id: Filter; label: string }[] = [
    { id: 'ALL', label: t('Tất cả', 'All energies') },
    ...energyLevels.map((id) => ({ id, label: energyNames[id] })),
  ];
  const { boards, activeBoardId } = useBoardStore();
  const activeBoards = boards.filter((board) => !board.isArchived);
  const activeBoard = activeBoards.find((board) => board.id === activeBoardId) ?? activeBoards[0];
  const boardTasks = tasks.filter((task) => !activeBoard
    || task.boardId === activeBoard.id
    || (activeBoard.id === activeBoards[0]?.id && (!task.boardId || task.boardId === 'board-main')));
  const doingTask = tasks.find((task) => task.status === 'DOING') ?? null;
  const { column, filter } = view;
  const [filterOpen, setFilterOpen] = useState(false);
  const [showContinuation, setShowContinuation] = useState(false);
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Task | null>(null);

  const detail = detailId ? tasks.find((task) => task.id === detailId || task.clientId === detailId) : null;
  const visible = boardTasks.filter((task) => isInColumn(task, column));
  if (filter !== 'ALL') {
    visible.sort((a, b) => Number(b.energyRequired === filter) - Number(a.energyRequired === filter));
  }

  const move = async (id: string, status: TaskStatus) => {
    if (await onMoveTask(id, status) && status === 'DONE') {
      useTaskStore.getState().showToast(t('Đã hoàn thành việc.', 'Task completed.'), 'success');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <ScreenHeader title={t('Bảng')} />
        <View style={styles.tools}>
          <Pressable style={[styles.toolButton, styles.boardButton]} onPress={() => setBoardPickerOpen(true)}
            accessibilityRole="button" accessibilityLabel={`${t('Chọn bảng')} · ${activeBoard?.title ?? ''}`}>
            <Text style={styles.toolText} numberOfLines={1}>{activeBoard?.title ?? t('Chọn bảng')}</Text>
            <OrbitIcon name="chevron" color={colors.muted} size={16} />
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => setFilterOpen(true)} accessibilityRole="button"
            accessibilityLabel={t('Ưu tiên theo năng lượng', 'Prioritize by energy')}>
            <OrbitIcon name="filter" color={colors.muted} size={18} />
            <Text style={styles.toolText}>{filter === 'ALL' ? t('Năng lượng', 'Energy') : energyNames[filter]}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}
        contentContainerStyle={styles.tabsContent}>
        {columns.map(({ id, label }) => {
          const count = boardTasks.filter((task) => isInColumn(task, id)).length;
          return (
            <Pressable key={id} style={[styles.tab, column === id && styles.tabActive]}
              accessibilityRole="tab" accessibilityState={{ selected: column === id }}
              onPress={() => onViewChange({ ...view, column: id })}>
              <Text style={[styles.tabText, column === id && styles.tabTextActive]}>{label} {count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showContinuation && doingTask && (
        <Pressable style={styles.continuation} accessibilityRole="button"
          onPress={() => void onFocusTask(doingTask.id)}>
          <Text style={styles.toolText}>{t('Tiếp tục')} · {doingTask.title}</Text>
          <OrbitIcon name="arrow" size={20} color={colors.accent} />
        </Pressable>
      )}

      <FlatList data={visible} keyExtractor={(task) => task.clientId ?? task.id}
        style={styles.listContainer} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{columns.find(({ id }) => id === column)?.empty}</Text>
            {column === 'WAITING' &&
              <Text style={styles.emptyHint}>{t('Ghi một việc bằng ô nhập bên dưới.', 'Capture a task in the field below.')}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard task={item} onMoveTask={move}
            onOpenDetail={(task) => setDetailId(task.clientId ?? task.id)}
            onFocusTask={async (task) => {
              if (task.status !== 'DOING') setDetailId(task.clientId ?? task.id);
              else if (!await onFocusTask(task.id)) setShowContinuation(true);
            }}
            isDimmed={filter !== 'ALL' && filter !== item.energyRequired}
            triggerRollback={rollbackTaskId === item.id}
          />
        )}
      />

      <QuickCaptureBar onAddTask={(title, energy, description) => {
        onQuickAdd(title, energy, description, activeBoard?.id);
        onViewChange({ ...view, column: 'WAITING' });
      }} />

      {filterOpen && <ChoiceSheet title={t('Ưu tiên theo năng lượng', 'Prioritize by energy')} selected={filter} choices={filters}
        onSelect={(filter) => onViewChange({ ...view, filter })} onClose={() => setFilterOpen(false)} />}
      <BoardSwitcherModal visible={boardPickerOpen} onClose={() => setBoardPickerOpen(false)} />
      <AIDecomposeModal visible={!!proposal} task={proposal} onClose={() => setProposal(null)}
        doingTask={doingTask} onApplySubtasks={onApplySubtasks} onStartFocus={onFocusTask} />
      <TaskDetailModal key={detail?.clientId ?? detail?.id} visible={!!detail && !proposal} task={detail ?? null} doingTask={doingTask}
        onClose={() => setDetailId(null)} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask}
        onMoveTask={onMoveTask} onToggleSubtask={onToggleSubtask} onApplySubtasks={onApplySubtasks}
        onOpenAIDecompose={setProposal} onStartFocus={onFocusTask} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tools: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  toolButton: { flexDirection: 'row', minHeight: 44, minWidth: 44, paddingHorizontal: 12, gap: 6, alignItems: 'center', borderRadius: 10, backgroundColor: colors.surface },
  boardButton: { flex: 1, justifyContent: 'space-between' },
  toolText: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  tabs: { flexGrow: 0, borderBottomColor: colors.border, borderBottomWidth: 1 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  tab: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, paddingVertical: 8, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  continuation: { minHeight: 44, marginHorizontal: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listContainer: { flex: 1 },
  list: { padding: 16, gap: 8 },
  empty: { paddingVertical: 24, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyHint: { color: colors.muted, fontSize: 14 },
});
