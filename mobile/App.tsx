import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BoardScreen } from './src/screens/BoardScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NotificationToast } from './src/components/NotificationToast';
import { BoardSkeleton } from './src/components/BoardSkeleton';
import { useTaskStore } from './src/store/useTaskStore';
import { useAuthStore } from './src/store/useAuthStore';
import { useBoardStore } from './src/store/useBoardStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { Task, EnergyLevel } from './src/types';

export default function App() {
  const {
    user,
    hasCompletedOnboarding,
    completeOnboarding,
    setEnergyLevel,
  } = useAuthStore();

  const { pomodoroMinutes } = useSettingsStore();

  const [currentScreen, setCurrentScreen] = useState<'ONBOARDING' | 'AUTH' | 'BOARD' | 'FOCUS' | 'SETTINGS'>(
    hasCompletedOnboarding ? 'BOARD' : 'ONBOARDING'
  );

  // Quản lý trạng thái toàn cục với Zustand + AsyncStorage Cache
  const {
    tasks,
    streak,
    isLoading,
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

  // Đồng bộ danh sách nhiệm vụ, bảng và streak từ backend ngay khi mở app
  useEffect(() => {
    fetchTasks();
    fetchBoards();
  }, [fetchTasks, fetchBoards]);

  // Đồng bộ màn hình ban đầu theo trạng thái onboarding
  useEffect(() => {
    if (!hasCompletedOnboarding && currentScreen !== 'AUTH') {
      setCurrentScreen('ONBOARDING');
    }
  }, [hasCompletedOnboarding]);

  // Nhiệm vụ đang được tập trung duy nhất ở cột DOING (WIP = 1)
  const doingTask = tasks.find((t) => t.status === 'DOING') || null;

  return (
    <View style={styles.appRoot}>
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
        {currentScreen === 'ONBOARDING' ? (
          <OnboardingScreen
            onComplete={(energy: EnergyLevel) => {
              completeOnboarding(energy);
              setEnergyLevel(energy);
              setCurrentScreen('BOARD');
            }}
            onNavigateAuth={() => setCurrentScreen('AUTH')}
          />
        ) : currentScreen === 'AUTH' ? (
          <AuthScreen
            onBack={() => setCurrentScreen(hasCompletedOnboarding ? 'BOARD' : 'ONBOARDING')}
            onSuccess={() => {
              fetchTasks();
              fetchBoards();
              setCurrentScreen('BOARD');
            }}
          />
        ) : isLoading && tasks.length === 0 ? (
          // Hiển thị Skeleton mờ dịu mắt (thay thế spinner xoay tròn gây lo âu cho người ADHD)
          <BoardSkeleton />
        ) : currentScreen === 'BOARD' ? (
          <BoardScreen
            tasks={tasks}
            streak={streak}
            user={user}
            onMoveTask={moveTask}
            onQuickAdd={addTask}
            onUpdateTask={updateTaskDetails}
            onDeleteTask={deleteTask}
            onApplySubtasks={applySubtasks}
            onToggleSubtask={toggleSubtask}
            onNavigateFocus={() => setCurrentScreen('FOCUS')}
            onNavigateAuth={() => setCurrentScreen('AUTH')}
            onNavigateSettings={() => setCurrentScreen('SETTINGS')}
            onFocusTask={async (task: Task) => {
              if (task.status !== 'DOING') {
                const moved = await moveTask(task.id, 'DOING');
                if (!moved) {
                  return; // Chặn không chuyển màn hình sang FOCUS nếu vi phạm WIP=1
                }
              }
              setCurrentScreen('FOCUS');
            }}
            rollbackTaskId={rollbackTaskId}
            isLoading={isLoading}
          />
        ) : currentScreen === 'SETTINGS' ? (
          <SettingsScreen
            onBack={() => setCurrentScreen('BOARD')}
            onNavigateAuth={() => setCurrentScreen('AUTH')}
          />
        ) : (
          <FocusScreen
            doingTask={doingTask}
            onExitFocus={() => setCurrentScreen('BOARD')}
            onCompleteTask={completeTask}
            onToggleSubtask={toggleSubtask}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Navigation (Visible on Kanban, Focus, and Settings screens) */}
      {(currentScreen === 'BOARD' || currentScreen === 'FOCUS' || currentScreen === 'SETTINGS') && (
        <SafeAreaView style={styles.bottomNavSafeArea}>
          <View style={styles.bottomNavBar}>
            <TouchableOpacity
              style={[
                styles.navTabItem,
                currentScreen === 'BOARD' && styles.navTabItemActive,
              ]}
              onPress={() => setCurrentScreen('BOARD')}
              activeOpacity={0.7}
            >
              <Text style={styles.navTabIcon}>📋</Text>
              <Text
                style={[
                  styles.navTabLabel,
                  currentScreen === 'BOARD' && styles.navTabLabelActive,
                ]}
              >
                Bảng Kanban
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navTabItem,
                currentScreen === 'FOCUS' && styles.navTabItemActive,
              ]}
              onPress={() => setCurrentScreen('FOCUS')}
              activeOpacity={0.7}
            >
              <View style={styles.focusIconWrapper}>
                <Text style={styles.navTabIcon}>🎯</Text>
                {doingTask && <View style={styles.activeDoingIndicator} />}
              </View>
              <Text
                style={[
                  styles.navTabLabel,
                  currentScreen === 'FOCUS' && styles.navTabLabelActive,
                ]}
              >
                Tập trung ({pomodoroMinutes}m)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navTabItem,
                currentScreen === 'SETTINGS' && styles.navTabItemActive,
              ]}
              onPress={() => setCurrentScreen('SETTINGS')}
              activeOpacity={0.7}
            >
              <Text style={styles.navTabIcon}>⚙️</Text>
              <Text
                style={[
                  styles.navTabLabel,
                  currentScreen === 'SETTINGS' && styles.navTabLabelActive,
                ]}
              >
                Cài đặt
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenContainer: {
    flex: 1,
  },
  bottomNavSafeArea: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  bottomNavBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 6,
    gap: 8,
  },
  navTabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  navTabIcon: {
    fontSize: 18,
  },
  navTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  navTabLabelActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  focusIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDoingIndicator: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
});
