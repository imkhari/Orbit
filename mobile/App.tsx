import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { BoardScreen } from './src/screens/BoardScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { Task, TaskStatus, EnergyLevel, Subtask } from './src/types';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    boardId: 'board-main',
    title: 'Soạn thảo slide bài tập lớn môn Trí tuệ Nhân tạo',
    description: 'Cần làm 10 slide tổng kết đồ án cho nhóm trước thứ 6',
    status: 'DOING',
    urgency: 'HIGH',
    energyRequired: 'HIGH',
    estimatedMinutes: 35,
    position: 0,
    createdAt: new Date().toISOString(),
    subtasks: [
      {
        id: 'sub-1-1',
        taskId: 'task-1',
        title: 'Chọn mẫu slide màu tối giản dịu mắt',
        estimatedMinutes: 5,
        energyLevel: 'LOW',
        stepOrder: 1,
        isCompleted: true,
      },
      {
        id: 'sub-1-2',
        taskId: 'task-1',
        title: 'Viết tiêu đề 4 phần chính',
        estimatedMinutes: 10,
        energyLevel: 'MEDIUM',
        stepOrder: 2,
        isCompleted: false,
      },
      {
        id: 'sub-1-3',
        taskId: 'task-1',
        title: 'Tổng hợp 3 biểu đồ đánh giá mô hình',
        estimatedMinutes: 20,
        energyLevel: 'HIGH',
        stepOrder: 3,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'task-2',
    boardId: 'board-main',
    title: 'Đọc 5 trang tài liệu về WCAG 2.1 cho người giảm chú ý',
    description: 'Chuẩn bị luận điểm cho buổi thuyết trình thiết kế',
    status: 'TODO',
    urgency: 'MEDIUM',
    energyRequired: 'LOW',
    estimatedMinutes: 15,
    position: 1,
    createdAt: new Date().toISOString(),
    subtasks: [
      {
        id: 'sub-2-1',
        taskId: 'task-2',
        title: 'Kiểm tra tỷ lệ tương phản chữ đạt >= 4.5:1',
        estimatedMinutes: 5,
        energyLevel: 'LOW',
        stepOrder: 1,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'task-5',
    boardId: 'board-main',
    title: 'Cấu hình pipeline CI/CD Docker & Spring Boot',
    description: 'Viết GitHub Actions workflow tự động deploy máy chủ thử nghiệm',
    status: 'TODO',
    urgency: 'HIGH',
    energyRequired: 'HIGH',
    estimatedMinutes: 45,
    position: 2,
    createdAt: new Date().toISOString(),
    subtasks: [],
  },
  {
    id: 'task-3',
    boardId: 'board-main',
    title: 'Lên danh sách tính năng cho Sprint tiếp theo',
    status: 'BACKLOG',
    urgency: 'LOW',
    energyRequired: 'MEDIUM',
    estimatedMinutes: 20,
    position: 3,
    createdAt: new Date().toISOString(),
    subtasks: [],
  },
  {
    id: 'task-4',
    boardId: 'board-main',
    title: 'Khởi tạo repository và viết PRD ban đầu',
    status: 'DONE',
    urgency: 'MEDIUM',
    energyRequired: 'HIGH',
    estimatedMinutes: 45,
    position: 4,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    subtasks: [],
  },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'BOARD' | 'FOCUS'>('BOARD');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Active task in DOING
  const doingTask = tasks.find((t) => t.status === 'DOING') || null;

  // Move task with strict WIP limit enforcement (Max 1 in DOING)
  const handleMoveTask = (taskId: string, targetStatus: TaskStatus) => {
    if (targetStatus === 'DOING') {
      const currentDoingTasks = tasks.filter(
        (t) => t.status === 'DOING' && t.id !== taskId
      );
      if (currentDoingTasks.length >= 1) {
        Alert.alert(
          '🎯 Giới hạn đơn nhiệm (WIP Limit: 1/1)',
          'Bộ não người ADHD hoạt động tốt nhất khi tập trung vào duy nhất một việc. Hãy hoàn thành hoặc đưa việc hiện tại về Todo trước nhé!',
          [{ text: 'Đã hiểu' }]
        );
        return;
      }
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
  };

  // Add task via Quick Capture bar
  const handleQuickAdd = (title: string, energy: EnergyLevel) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      boardId: 'board-main',
      title,
      status: 'BACKLOG',
      urgency: 'MEDIUM',
      energyRequired: energy,
      estimatedMinutes: 15,
      position: tasks.length,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Apply subtasks from AI Breakdown
  const handleApplySubtasks = (taskId: string, newSubtasks: Subtask[]) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...t.subtasks, ...newSubtasks],
              estimatedMinutes:
                (t.estimatedMinutes || 0) +
                newSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0),
            }
          : t
      )
    );
  };

  // Toggle subtask completion (tick micro-step)
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = t.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        return { ...t, subtasks: updatedSubs };
      })
    );
  };

  // Complete task from FocusScreen
  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'DONE',
              completedAt: new Date().toISOString(),
              subtasks: t.subtasks.map((s) => ({ ...s, isCompleted: true })),
            }
          : t
      )
    );
  };

  return (
    <View style={styles.appRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Screen Presentation */}
      <View style={styles.screenContainer}>
        {currentScreen === 'BOARD' ? (
          <BoardScreen
            tasks={tasks}
            onMoveTask={handleMoveTask}
            onQuickAdd={handleQuickAdd}
            onApplySubtasks={handleApplySubtasks}
            onNavigateFocus={() => setCurrentScreen('FOCUS')}
            onFocusTask={(task) => {
              // Ensure task is in DOING, then navigate to focus
              if (task.status !== 'DOING') {
                handleMoveTask(task.id, 'DOING');
              }
              setCurrentScreen('FOCUS');
            }}
          />
        ) : (
          <FocusScreen
            doingTask={doingTask}
            onExitFocus={() => setCurrentScreen('BOARD')}
            onCompleteTask={handleCompleteTask}
            onToggleSubtask={handleToggleSubtask}
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
              {doingTask && (
                <View style={styles.activeDoingIndicator} />
              )}
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
