import { useLocale } from './src/ui/locale';
import React, { useState, useEffect, useRef } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BoardScreen, type BoardView } from './src/screens/BoardScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationToast } from './src/components/NotificationToast';
import { API_BASE_URL } from './src/services/api';
import { useTaskStore } from './src/store/useTaskStore';
import { useAuthStore } from './src/store/useAuthStore';
import { useBoardStore } from './src/store/useBoardStore';
import { useFocusStore } from './src/store/useFocusStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { TodayScreen } from './src/screens/TodayScreen';
import { OrbitIcon, IconName } from './src/ui/OrbitIcon';
import { colors } from './src/ui/theme';
import { EnergyLevel, Subtask } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <OrbitApp />
    </SafeAreaProvider>
  );
}

type Tab = 'TODAY' | 'BOARD' | 'SETTINGS';
function OrbitApp() {
  const t = useLocale();
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'TODAY', label: t('Hôm nay'), icon: 'today' },
    { id: 'BOARD', label: t('Bảng'), icon: 'board' },
    { id: 'SETTINGS', label: t('Cài đặt'), icon: 'settings' },
  ];
  const {
    user,
    requiresSignIn,
    hasCompletedOnboarding,
    completeOnboarding,
    setEnergyLevel,
  } = useAuthStore();

  const [currentScreen, setCurrentScreen] = useState<Tab | 'ONBOARDING' | 'AUTH' | 'FOCUS'>(
    hasCompletedOnboarding ? 'TODAY' : 'ONBOARDING'
  );
  const [boardView, setBoardView] = useState<BoardView>({ column: 'WAITING', filter: 'ALL' });

  // Quản lý trạng thái toàn cục với Zustand + AsyncStorage Cache
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTaskDetails,
    deleteTask,
    moveTask,
    toggleSubtask,
    applySubtasks,
    completeTask,
    rollbackTaskId,
    toast,
    hideToast,
  } = useTaskStore();

  const { fetchBoards } = useBoardStore();

  const startingFocus = useRef(false);
  const focusOrigin = useRef<Tab>('TODAY');
  const [ready, setReady] = useState(false);
  const doingTask = tasks.find((task) => task.status === 'DOING') ?? null;

  useEffect(() => {
    let mounted = true;
    let initialized = false;
    let stopAccountSubscription: (() => void) | undefined;
    const bindAccount = (state: ReturnType<typeof useAuthStore.getState>) => {
      const owner = state.isAuthenticated && state.user
        ? `${API_BASE_URL}#${state.user.id}`
        : state.requiresSignIn ? 'locked' : `${API_BASE_URL}#local-preview`;
      useTaskStore.getState().bindWorkspace(owner);
      useBoardStore.getState().bindWorkspace(owner);
      useFocusStore.getState().bindWorkspace(owner);
    };
    const start = () => {
      if (!mounted || initialized || !useTaskStore.persist.hasHydrated() || !useAuthStore.persist.hasHydrated()
        || !useBoardStore.persist.hasHydrated() || !useFocusStore.persist.hasHydrated()
        || !useSettingsStore.persist.hasHydrated()) return;
      initialized = true;
      const account = useAuthStore.getState();
      bindAccount(account);
      stopAccountSubscription = useAuthStore.subscribe((next, previous) => {
        if (next.sessionRevision !== previous.sessionRevision) bindAccount(next);
      });
      if (account.hasCompletedOnboarding) {
        setCurrentScreen((screen) => screen === 'ONBOARDING' ? 'TODAY' : screen);
      }
      if (!account.requiresSignIn) {
        void fetchTasks();
        void fetchBoards();
      }
      setReady(true);
    };

    const unsubscribe = [
      useTaskStore.persist.onFinishHydration(start),
      useAuthStore.persist.onFinishHydration(start),
      useBoardStore.persist.onFinishHydration(start),
      useFocusStore.persist.onFinishHydration(start),
      useSettingsStore.persist.onFinishHydration(start),
    ];
    start();
    return () => {
      mounted = false;
      stopAccountSubscription?.();
      unsubscribe.forEach((stop) => stop());
    };
  }, [fetchTasks, fetchBoards]);

  const exitFocus = () => {
    useFocusStore.getState().pause();
    setCurrentScreen(focusOrigin.current);
  };

  useEffect(() => {
    if (currentScreen !== 'FOCUS') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exitFocus();
      return true;
    });
    return () => subscription.remove();
  }, [currentScreen]);

  const startFocus = async (taskId: string, step?: Subtask): Promise<boolean> => {
    if (startingFocus.current) return false;
    startingFocus.current = true;
    const revision = useAuthStore.getState().sessionRevision;
    try {
      const taskStore = useTaskStore.getState();
      const active = taskStore.tasks.find((task) => task.status === 'DOING');
      if (active && active.id !== taskId && active.clientId !== taskId) {
        await moveTask(taskId, 'DOING');
        return false;
      }

      let task = await taskStore.ensureTask(taskId);
      if (!task) {
        taskStore.showToast(t("Chưa lưu được việc này. Bạn có thể thử lại.", "Could not save this task. Try again."), 'warning');
        return false;
      }

      let selected = step && task.subtasks.find((item) => !item.isCompleted && (
        step.id ? item.id === step.id : item.title === step.title && item.estimatedMinutes === step.estimatedMinutes
      ));
      if (step && !step.id && !selected) {
        // Một gợi ý chưa thuộc checklist được lưu cùng các bước hiện có.
        const checklist = [step, ...[...task.subtasks].sort((a, b) => a.stepOrder - b.stepOrder)]
          .map((item, index) => ({ ...item, stepOrder: index + 1 }));
        task = await applySubtasks(task.id, checklist);
        selected = task?.subtasks.find((item) => item.stepOrder === 1);
      }

      if (!task || (step && !selected)) {
        taskStore.showToast(t("Chưa lưu được bước khởi động. Bạn có thể thử lại.", "Could not save the first step. Try again."), 'warning');
        return false;
      }
      if (!await moveTask(task.id, 'DOING') || revision !== useAuthStore.getState().sessionRevision) return false;

      useFocusStore.getState().open(task.id, selected?.id);
      focusOrigin.current = currentScreen === 'BOARD' ? 'BOARD' : 'TODAY';
      setCurrentScreen('FOCUS');
      return true;
    } finally {
      startingFocus.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      enabled={!requiresSignIn && (currentScreen === 'BOARD' || currentScreen === 'TODAY')}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.appRoot}
    >
      <StatusBar style="light" />

      {/* Floating Empathetic Toast Notification for WIP=1 and System notices */}
      <NotificationToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        durationMs={3500}
      />

      {/* Screen Presentation */}
      <View style={styles.screenContainer}>
        {!ready ? (
          <View style={styles.launch} accessibilityRole="progressbar" accessibilityLabel={t("Đang mở Orbit", "Opening Orbit")}>
            <OrbitIcon name="today" color={colors.accent} size={108} />
          </View>
        ) : requiresSignIn || currentScreen === 'AUTH' ? (
          <AuthScreen
            onBack={() => setCurrentScreen(hasCompletedOnboarding ? 'TODAY' : 'ONBOARDING')}
            onSuccess={() => {
              void fetchTasks();
              void fetchBoards();
              setCurrentScreen('TODAY');
            }}
          />
        ) : currentScreen === 'ONBOARDING' ? (
          <OnboardingScreen
            onComplete={(energy: EnergyLevel) => {
              completeOnboarding(energy);
              setEnergyLevel(energy);
              setCurrentScreen('TODAY');
            }}
            onNavigateAuth={() => setCurrentScreen('AUTH')}
          />
        ) : currentScreen === 'TODAY' ? (
          <TodayScreen
            tasks={tasks} doingTask={doingTask} energy={user?.currentEnergyLevel ?? 'MEDIUM'}
            isLoading={isLoading} hasLoadError={!!error}
            onEnergyChange={setEnergyLevel} onRetry={() => void fetchTasks()}
            onCreate={addTask} onApplySubtasks={applySubtasks} onStartFocus={startFocus}
            onUpdateTask={updateTaskDetails} onDeleteTask={deleteTask} onToggleSubtask={toggleSubtask}
            onMoveTask={moveTask}
          />
        ) : currentScreen === 'BOARD' ? (
          <BoardScreen
            tasks={tasks} onMoveTask={moveTask} onQuickAdd={addTask}
            view={boardView} onViewChange={setBoardView}
            onUpdateTask={updateTaskDetails} onDeleteTask={deleteTask}
            onApplySubtasks={applySubtasks} onToggleSubtask={toggleSubtask}
            onFocusTask={startFocus} rollbackTaskId={rollbackTaskId}
          />
        ) : currentScreen === 'SETTINGS' ? (
          <SettingsScreen
            onBack={() => setCurrentScreen('TODAY')}
            onNavigateAuth={() => setCurrentScreen('AUTH')}
          />
        ) : (
          <FocusScreen
            doingTask={doingTask}
            onExitFocus={exitFocus}
            onCompleteTask={completeTask}
            onToggleSubtask={toggleSubtask}
          />
        )}
      </View>

      {ready && !requiresSignIn && tabs.some((tab) => tab.id === currentScreen) && (
        <SafeAreaView style={styles.bottomNavSafeArea} edges={['bottom', 'left', 'right']}>
          <View style={styles.bottomNavBar}>
            {tabs.map((tab) => {
              const selected = currentScreen === tab.id;
              return (
                <TouchableOpacity key={tab.id} style={[styles.navTabItem, selected && styles.navTabItemActive]}
                  onPress={() => setCurrentScreen(tab.id)} activeOpacity={0.7}
                  accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected }}>
                  <OrbitIcon name={tab.icon} color={selected ? colors.accent : colors.muted} size={22} />
                  <Text style={[styles.navTabLabel, selected && styles.navTabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  launch: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  appRoot: { flex: 1, backgroundColor: colors.canvas },
  screenContainer: { flex: 1 },
  bottomNavSafeArea: { backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border },
  bottomNavBar: { flexDirection: 'row', padding: 8, gap: 8 },
  navTabItem: { flex: 1, minHeight: 48, minWidth: 44, paddingVertical: 4, justifyContent: 'center', alignItems: 'center', gap: 2, borderRadius: 10 },
  navTabItemActive: { backgroundColor: colors.surface },
  navTabLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textAlign: 'center' },
  navTabLabelActive: { color: colors.text },
});
