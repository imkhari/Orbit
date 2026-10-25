import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { BoardScreen } from './src/screens/BoardScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { NotificationToast } from './src/components/NotificationToast';
import { BoardSkeleton } from './src/components/BoardSkeleton';
import { useTaskStore } from './src/store/useTaskStore';
import { Task } from './src/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'BOARD' | 'FOCUS'>('BOARD');

  // Quản lý trạng thái toàn cục với Zustand + AsyncStorage Cache
  const {
    tasks,
    isLoading,
    fetchTasks,
    addTask,
    moveTask,
    toggleSubtask,
    applySubtasks,
    completeTask,
    rollbackTaskId,
    toast,
    hideToast,
  } = useTaskStore();

  // Đồng bộ danh sách nhiệm vụ từ backend ngay khi mở app
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Nhiệm vụ đang được tập trung duy nhất ở cột DOING (WIP = 1)
  const doingTask = tasks.find((t) => t.status === 'DOING') || null;

  return (
    <View style={styles.appRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

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
        {isLoading && tasks.length === 0 ? (
          // Hiển thị Skeleton mờ dịu mắt (thay thế spinner xoay tròn gây lo âu cho người ADHD)
          <BoardSkeleton />
        ) : currentScreen === 'BOARD' ? (
          <BoardScreen
            tasks={tasks}
            onMoveTask={moveTask}
            onQuickAdd={addTask}
            onApplySubtasks={applySubtasks}
            onNavigateFocus={() => setCurrentScreen('FOCUS')}
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
        ) : (
          <FocusScreen
            doingTask={doingTask}
            onExitFocus={() => setCurrentScreen('BOARD')}
            onCompleteTask={completeTask}
            onToggleSubtask={toggleSubtask}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Navigation */}
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
              Tập trung (25m)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    backgroundColor: '#0B1120',
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#0B1120',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 48,
  },
  navTabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  navTabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  focusIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDoingIndicator: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0B1120',
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navTabLabelActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
