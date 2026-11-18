import { deviceText } from '../ui/locale';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError, isCancel } from 'axios';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, TaskStatus, EnergyLevel, Subtask, StreakResponse } from '../types';
import { TaskService, StreakService } from '../services/api';

export interface ToastNotificationState {
  visible: boolean;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezeCredits: number;
  streakState: 'ACTIVE' | 'FROZEN' | 'RESET';
  totalXp: number;
  currentLevel: number;
  isFrozenToday: boolean;
  gentleMessage?: string;
}

interface TaskWorkspace {
  tasks: Task[];
  streak: StreakState;
}

export interface TaskStoreState {
  workspaceOwner: string | null;
  savedWorkspaces: Record<string, TaskWorkspace>;
  bindWorkspace: (owner: string) => void;
  tasks: Task[];
  streak: StreakState;
  isLoading: boolean;
  error: string | null;
  rollbackTaskId: string | null;
  toast: ToastNotificationState;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  addTask: (title: string, energy?: EnergyLevel, description?: string, boardId?: string) => Task | null;
  ensureTask: (id: string, retry?: boolean) => Promise<Task | null>;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, targetStatus: TaskStatus) => Promise<boolean>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<boolean>;
  applySubtasks: (taskId: string, newSubtasks: Subtask[]) => Promise<Task | null>;
  completeTask: (taskId: string) => Promise<boolean>;
  showToast: (message: string, type?: 'info' | 'warning' | 'success') => void;
  hideToast: () => void;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 5,
  longestStreak: 5,
  freezeCredits: 2,
  streakState: 'ACTIVE',
  totalXp: 150,
  currentLevel: 1,
  isFrozenToday: false,
  gentleMessage: 'Mỗi bước nhỏ đều tạo nên bước nhảy lớn 🌿',
};

const pendingCreates = new Map<string, Promise<Task | null>>();
const movingTasks = new Set<string>();
const updatingChecklists = new Set<string>();
let startingTaskId: string | null = null;

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      streak: DEFAULT_STREAK,
      workspaceOwner: null,
      savedWorkspaces: {},
      bindWorkspace: (owner) => {
        const current = get();
        if (current.workspaceOwner === owner) return;
        const savedWorkspaces = { ...current.savedWorkspaces };
        if (current.workspaceOwner && current.workspaceOwner !== 'locked') {
          savedWorkspaces[current.workspaceOwner] = { tasks: current.tasks, streak: current.streak };
        }
        const next = savedWorkspaces[owner];
        delete savedWorkspaces[owner];
        set({
          workspaceOwner: owner, savedWorkspaces,
          tasks: next?.tasks ?? [], streak: next?.streak ?? DEFAULT_STREAK,
          isLoading: false, error: null, rollbackTaskId: null,
          toast: { visible: false, message: '', type: 'info' },
        });
      },
      isLoading: false,
      error: null,
      rollbackTaskId: null,
      toast: {
        visible: false,
        message: '',
        type: 'warning',
      },

      /**
       * 1. fetchTasks(): Gọi API lấy dữ liệu; nếu mất mạng thì giữ nguyên dữ liệu trong AsyncStorage cache.
       * Đồng thời đồng bộ trạng thái Streak và Khiên Bảo Vệ.
       */
      fetchTasks: async () => {
        const initialTasks = new Map(get().tasks.map((task) => [task.id, task]));
        set({ isLoading: true, error: null });
        try {
          const fetchedTasks = await TaskService.getTasks();
          const currentTasks = get().tasks;
          const currentById = new Map(currentTasks.map((task) => [task.id, task]));
          const mergedTasks = fetchedTasks.flatMap((task) => {
            const current = currentById.get(task.id);
            if (!current && initialTasks.has(task.id)) return [];
            if (current && (current !== initialTasks.get(task.id) || movingTasks.has(task.id) || updatingChecklists.has(task.id))) {
              return [current];
            }
            return [{ ...task, clientId: current?.clientId }];
          });
          const fetchedIds = new Set(fetchedTasks.map((task) => task.id));
          const pendingOfflineTasks = currentTasks.filter((task) =>
            !fetchedIds.has(task.id) && (task.id.startsWith('temp-') || task !== initialTasks.get(task.id))
          );

          set({
            tasks: [...pendingOfflineTasks, ...mergedTasks],
            isLoading: false,
            error: null,
          });

          // Tải thêm trạng thái Streak song song
          get().fetchStreak();
        } catch (err: any) {
          if (isCancel(err)) return;
          // Khi mất mạng: giữ nguyên dữ liệu trong AsyncStorage cache, không xóa trắng
          const errorMessage =
            err?.message || 'Không thể kết nối máy chủ — Đang dùng dữ liệu lưu tạm trên máy';
          console.warn('fetchTasks offline fallback: giữ nguyên cache dữ liệu', errorMessage);
          set({
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      /**
       * fetchStreak(): Lấy thông tin Streak & Freeze Shield từ GET /api/v1/users/me/streak
       */
      fetchStreak: async () => {
        try {
          const data: StreakResponse = await StreakService.getStreak();
          set({
            streak: {
              currentStreak: data.currentStreak ?? 5,
              longestStreak: data.longestStreak ?? 5,
              freezeCredits: data.freezeCredits ?? 2,
              streakState: data.streakState ?? 'ACTIVE',
              totalXp: data.totalXp ?? 150,
              currentLevel: data.currentLevel ?? 1,
              isFrozenToday: Boolean(data.isFrozenToday),
              gentleMessage: data.gentleMessage ?? 'Mỗi bước nhỏ đều tạo nên bước nhảy lớn 🌿',
            },
          });
        } catch (err: any) {
          if (isCancel(err)) return;
          console.warn('fetchStreak offline fallback: giữ nguyên cache streak', err?.message);
        }
      },

      /**
       * 2. addTask(title, energy, description): Thực hiện Optimistic Prepend (thêm ngay vào đầu cột BACKLOG < 5s)
       * và gọi ngầm TaskService.quickCapture.
       * Hỗ trợ Edge Case 05: Tự động tách 100 ký tự đầu làm tiêu đề nếu văn bản nhập quá dài.
       */
      addTask: (title: string, energy: EnergyLevel = 'MEDIUM', description?: string, boardId?: string) => {
        const cleanTitle = title.trim();
        if (!cleanTitle) return null;

        let effectiveTitle = cleanTitle;
        let effectiveDesc = description?.trim();
        let wasAutoSplit = false;

        // Edge Case 05 trong PRD: Tiêu đề dài > 100 ký tự -> Tự động cắt 100 ký tự làm title, phần còn lại làm description
        if (cleanTitle.length > 100) {
          wasAutoSplit = true;
          effectiveTitle = cleanTitle.slice(0, 100).trim();
          const remainder = cleanTitle.slice(100).trim();
          effectiveDesc = effectiveDesc ? `${remainder}\n\n${effectiveDesc}` : remainder;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticTask: Task = {
          id: tempId,
          boardId: boardId || 'board-main',
          title: effectiveTitle,
          description: effectiveDesc,
          status: 'BACKLOG',
          urgency: 'MEDIUM',
          energyRequired: energy,
          estimatedMinutes: 15,
          position: 0,
          createdAt: new Date().toISOString(),
          subtasks: [],
        };

        // Optimistic Prepend: hiển thị tức thì trên UI < 5s
        set((state) => ({
          tasks: [optimisticTask, ...state.tasks],
          ...(wasAutoSplit
            ? {
                toast: {
                  visible: true,
                  message:
                    deviceText('🌿 Orbit đã giúp bạn tóm gọn tiêu đề và lưu phần chi tiết còn lại vào mục ghi chú rồi nhé!', 'Orbit saved the rest of your task name in Notes.'),
                  type: 'info' as const,
                },
              }
            : {}),
        }));

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        void get().ensureTask(tempId).then((saved) => {
          if (!saved && get().tasks.some((task) => task.id === tempId)) {
            get().showToast(deviceText('Đã lưu trên máy. Orbit sẽ thử đồng bộ khi bạn bắt đầu.', 'Saved on this device. Orbit will sync when you start.'), 'info');
          }
        });
        return optimisticTask;
      },

      ensureTask: async (id, retry = true) => {
        const owner = get().workspaceOwner;
        const task = get().tasks.find((item) => item.id === id || item.clientId === id);
        if (!task || !task.id.startsWith('temp-')) return task ?? null;

        const pending = pendingCreates.get(task.id);
        if (pending) return pending;
        if (!retry) return null;

        // Các bảng gợi ý trên máy chưa có UUID. Backend sẽ chọn bảng mặc định.
        const boardId = /^[a-f0-9-]{36}$/i.test(task.boardId) ? task.boardId : undefined;
        const request = TaskService.quickCapture(task.title, task.energyRequired, task.description, boardId)
          .then(async (saved) => {
            if (get().workspaceOwner !== owner) return null;
            const current = get().tasks.find((item) => item.id === task.id);
            if (!current) {
              await TaskService.deleteTask(saved.id);
              return null;
            }
            const resolved = { ...saved, clientId: task.id };
            set((state) => ({
              tasks: state.tasks.filter((item) => item.id !== saved.id).map((item) =>
                item.id === task.id ? resolved : item
              ),
            }));
            return resolved;
          })
          .catch(() => null)
          .finally(() => pendingCreates.delete(task.id));

        pendingCreates.set(task.id, request);
        return request;
      },

      /**
       * updateTaskDetails(taskId, updates): Cập nhật thông tin chi tiết nhiệm vụ (tiêu đề, ghi chú, năng lượng, deadline...)
       */
      updateTaskDetails: async (id, updates) => {
        const owner = get().workspaceOwner;
        const task = await get().ensureTask(id);
        if (!task || get().workspaceOwner !== owner) return false;

        try {
          const saved = await TaskService.updateTask(task.id, {
            title: updates.title,
            description: updates.description,
            energyRequired: updates.energyRequired,
            urgency: updates.urgency,
            estimatedMinutes: updates.estimatedMinutes,
            deadline: updates.deadline,
          });
          if (get().workspaceOwner !== owner) return false;
          set((state) => ({ tasks: state.tasks.map((current) => current.id === task.id ? {
            ...current, title: saved.title, description: saved.description, energyRequired: saved.energyRequired,
            urgency: saved.urgency, deadline: saved.deadline, estimatedMinutes: saved.estimatedMinutes,
          } : current) }));
          get().showToast(deviceText('Đã lưu thay đổi.', 'Changes saved.'), 'success');
          return true;
        } catch {
          return false;
        }
      },

      /**
       * deleteTask(taskId): Xóa vĩnh viễn nhiệm vụ khỏi bảng với xác nhận dịu êm
       */
      deleteTask: async (taskId: string) => {
        // Xóa lạc quan trên giao diện
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          toast: {
            visible: true,
            message: deviceText('🌿 Nhiệm vụ đã được dọn dẹp gọn gàng.', 'Task deleted.'),
            type: 'info',
          },
        }));

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        try {
          await TaskService.deleteTask(taskId);
        } catch (err: any) {
          console.warn('deleteTask offline sync (đã xóa trên bộ nhớ tạm thiết bị):', err?.message);
        }
      },

      moveTask: async (taskId, targetStatus) => {
        const starting = targetStatus === 'DOING';
        const otherDoingTask = (id: string) => get().tasks.find((item) =>
          item.status === 'DOING' && item.id !== id && item.clientId !== id
        );
        const showConflict = (id: string) => {
          const active = otherDoingTask(id);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          set({ rollbackTaskId: id });
          get().showToast(active ? deviceText(`Bạn đang làm “${active.title}”.`, `You’re working on “${active.title}”.`) : deviceText('Orbit đang giữ một việc để bạn tập trung.', 'Orbit keeps one task in progress.'), 'warning');
          setTimeout(() => {
            if (get().rollbackTaskId === id) set({ rollbackTaskId: null });
          }, 800);
        };

        if (starting && otherDoingTask(taskId)) {
          showConflict(taskId);
          return false;
        }

        const owner = get().workspaceOwner;
        const task = await get().ensureTask(taskId);
        if (get().workspaceOwner !== owner) return false;
        if (!task) {
          get().showToast(deviceText('Chưa lưu được việc này. Bạn có thể thử lại.', 'Could not save this task. Try again.'), 'warning');
          return false;
        }
        if (movingTasks.has(task.id)) return false;
        if (task.status === targetStatus) return true;

        if (starting && (startingTaskId || otherDoingTask(task.id))) {
          showConflict(task.id);
          return false;
        }

        movingTasks.add(task.id);
        if (starting) startingTaskId = task.id;
        try {
          const saved = await TaskService.updateTaskStatus(task.id, targetStatus);
          set((state) => ({
            tasks: state.tasks.map((item) => item.id === task.id
              ? { ...item, status: saved.status, completedAt: saved.completedAt }
              : item),
          }));
          if (targetStatus === 'DONE') {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void get().fetchStreak();
          }
          return true;
        } catch (error) {
          if (isCancel(error) || get().workspaceOwner !== owner) return false;
          if (starting && isAxiosError(error) && error.response?.status === 409) {
            showConflict(task.id);
            void get().fetchTasks();
          } else {
            get().showToast(deviceText('Chưa lưu được thay đổi. Bạn có thể thử lại.', 'Could not save the change. Try again.'), 'warning');
          }
          return false;
        } finally {
          movingTasks.delete(task.id);
          if (starting) startingTaskId = null;
        }
      },

      toggleSubtask: async (taskId, subtaskId) => {
        if (updatingChecklists.has(taskId)) return false;
        updatingChecklists.add(taskId);
        try {
          const saved = await TaskService.toggleSubtask(taskId, subtaskId);
          set((state) => ({
            tasks: state.tasks.map((task) => task.id === taskId ? {
              ...task,
              subtasks: task.subtasks.map((step) => step.id === subtaskId ? { ...step, ...saved } : step),
            } : task),
          }));
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          void get().fetchStreak();
          return true;
        } catch (error) {
          if (!isCancel(error)) get().showToast(deviceText('Chưa lưu được bước này. Bạn có thể thử lại.', 'Could not save this step. Try again.'), 'warning');
          return false;
        } finally {
          updatingChecklists.delete(taskId);
        }
      },

      applySubtasks: async (taskId, newSubtasks) => {
        const owner = get().workspaceOwner;
        const task = await get().ensureTask(taskId);
        if (!task || get().workspaceOwner !== owner || updatingChecklists.has(task.id)) return null;

        updatingChecklists.add(task.id);
        try {
          const result = await TaskService.applySubtasks(task.id, newSubtasks);
          const subtasks = [...result.subtasks].sort((a, b) => a.stepOrder - b.stepOrder);
          const updated = {
            ...result.task,
            subtasks,
            clientId: task.clientId,
            estimatedMinutes: subtasks.length
              ? subtasks.reduce((total, step) => total + step.estimatedMinutes, 0)
              : result.task.estimatedMinutes,
          };
          set((state) => ({
            tasks: state.tasks.map((item) => item.id === task.id
              ? { ...item, subtasks, estimatedMinutes: updated.estimatedMinutes }
              : item),
          }));
          return updated;
        } catch {
          return null;
        } finally {
          updatingChecklists.delete(task.id);
        }
      },

      completeTask: (taskId) => get().moveTask(taskId, 'DONE'),

      /**
       * Điều khiển hiển thị Toast thông báo dịu êm
       */
      showToast: (message: string, type: 'info' | 'warning' | 'success' = 'warning') => {
        set({
          toast: {
            visible: true,
            message,
            type,
          },
        });
      },

      hideToast: () => {
        set((state) => ({
          toast: { ...state.toast, visible: false },
        }));
      },
    }),
    {
      name: 'orbit-task-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Lưu danh sách tasks và streak vào AsyncStorage cache
      partialize: (state) => ({
        tasks: state.tasks,
        streak: state.streak,
        workspaceOwner: state.workspaceOwner,
        savedWorkspaces: state.savedWorkspaces,
      }),
    }
  )
);
