import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Task, TaskStatus, EnergyLevel, Subtask } from '../types';
import { TaskCard } from '../components/TaskCard';
import { QuickCaptureBar } from '../components/QuickCaptureBar';
import { AIDecomposeModal } from '../components/AIDecomposeModal';

interface BoardScreenProps {
  onNavigateFocus?: () => void;
}

export const BoardScreen: React.FC<BoardScreenProps> = ({ onNavigateFocus }) => {
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('TODO');
  const [decomposingTask, setDecomposingTask] = useState<Task | null>(null);

  // Initial mock tasks representing realistic ADHD scenarios
  const [tasks, setTasks] = useState<Task[]>([
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
      position: 2,
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
      position: 3,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      subtasks: [],
    },
  ]);

  // Handle task moving with strict WIP (Work-in-progress) check
  const handleMoveTask = (taskId: string, targetStatus: TaskStatus) => {
    // Check WIP limit on DOING column (Max 1 task)
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

  // Add new task via Quick Capture bar
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
    // Switch to Backlog column so user immediately observes creation
    setActiveColumn('BACKLOG');
  };

  // Apply subtasks from AI Breakdown modal
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

  // Column definitions
  const columns: Array<{ status: TaskStatus; label: string; count: number }> = [
    {
      status: 'BACKLOG',
      label: 'Backlog',
      count: tasks.filter((t) => t.status === 'BACKLOG').length,
    },
    {
      status: 'TODO',
      label: 'Cần làm',
      count: tasks.filter((t) => t.status === 'TODO').length,
    },
    {
      status: 'DOING',
      label: 'Đang làm (1/1)',
      count: tasks.filter((t) => t.status === 'DOING').length,
    },
    {
      status: 'DONE',
      label: 'Đã xong',
      count: tasks.filter((t) => t.status === 'DONE').length,
    },
  ];

  const currentColumnTasks = tasks.filter((t) => t.status === activeColumn);

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🌌 Orbit</Text>
          <Text style={styles.headerSubtitle}>
            Điều phối công việc cho tâm trí ADHD
          </Text>
        </View>

        {onNavigateFocus ? (
          <TouchableOpacity
            style={styles.focusHeaderBtn}
            onPress={onNavigateFocus}
            activeOpacity={0.8}
          >
            <Text style={styles.focusHeaderBtnText}>🎯 Focus Mode</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>⚡ Năng lượng: Vừa</Text>
          </View>
        )}
      </View>

      {/* Column Tabs */}
      <View style={styles.columnTabBar}>
        {columns.map((col) => {
          const isActive = activeColumn === col.status;
          return (
            <TouchableOpacity
              key={col.status}
              style={[styles.columnTab, isActive && styles.columnTabActive]}
              onPress={() => setActiveColumn(col.status)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.columnTabText,
                  isActive && styles.columnTabTextActive,
                ]}
              >
                {col.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  isActive && styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    isActive && styles.countBadgeTextActive,
                  ]}
                >
                  {col.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task Cards List */}
      <ScrollView
        style={styles.taskListContainer}
        contentContainerStyle={styles.taskListContent}
      >
        {currentColumnTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>Chưa có công việc nào ở cột này</Text>
            <Text style={styles.emptySubtitle}>
              Thêm nhanh một việc ở thanh dưới đáy để bắt đầu nhẹ nhàng nhé!
            </Text>
          </View>
        ) : (
          currentColumnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMoveTask={handleMoveTask}
              onOpenAIDecompose={(t) => setDecomposingTask(t)}
            />
          ))
        )}
      </ScrollView>

      {/* Bottom Quick Capture Bar */}
      <QuickCaptureBar onAddTask={handleQuickAdd} />

      {/* AI Task Decomposition Modal */}
      <AIDecomposeModal
        visible={decomposingTask !== null}
        task={decomposingTask}
        onClose={() => setDecomposingTask(null)}
        onApplySubtasks={handleApplySubtasks}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusPillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  focusHeaderBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  focusHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  columnTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 6,
  },
  columnTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  columnTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  columnTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginRight: 4,
  },
  columnTabTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: '#38BDF8',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  countBadgeTextActive: {
    color: '#0F172A',
  },
  taskListContainer: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
