import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export interface TaskStoreState {
  tasks: Task[];
  streak: StreakState;
  isLoading: boolean;
  error: string | null;
  rollbackTaskId: string | null;
  toast: ToastNotificationState;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  addTask: (title: string, energy?: EnergyLevel) => Promise<void>;
  moveTask: (taskId: string, targetStatus: TaskStatus) => Promise<boolean>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  applySubtasks: (taskId: string, newSubtasks: Subtask[]) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
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

export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      streak: DEFAULT_STREAK,
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
        set({ isLoading: true, error: null });
        try {
          const fetchedTasks = await TaskService.getTasks();
          const currentTasks = get().tasks;

          // Hợp nhất dữ liệu server với cache địa phương, bảo tồn subtasks đã có (loại bỏ N+1 HTTP request)
          const mergedTasks: Task[] = fetchedTasks.map((ft) => {
            const localMatch = currentTasks.find((t) => t.id === ft.id);
            if (localMatch && localMatch.subtasks && localMatch.subtasks.length > 0) {
              return {
                ...ft,
                subtasks: localMatch.subtasks,
              };
            }
            return ft;
          });

          // Giữ lại các task tạo tạm thời lúc offline chưa đồng bộ
          const pendingOfflineTasks = currentTasks.filter((t) => t.id.startsWith('temp-'));

          set({
            tasks: [...pendingOfflineTasks, ...mergedTasks],
            isLoading: false,
            error: null,
          });

          // Tải thêm trạng thái Streak song song
          get().fetchStreak();
        } catch (err: any) {
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
          console.warn('fetchStreak offline fallback: giữ nguyên cache streak', err?.message);
        }
      },

      /**
       * 2. addTask(title, energy): Thực hiện Optimistic Prepend (thêm ngay vào đầu cột BACKLOG < 5s)
       * và gọi ngầm TaskService.quickCapture.
       */
      addTask: async (title: string, energy: EnergyLevel = 'MEDIUM') => {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticTask: Task = {
          id: tempId,
          boardId: 'board-main',
          title: cleanTitle,
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
        }));

        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Gọi ngầm lên API backend
        try {
          const serverTask = await TaskService.quickCapture(cleanTitle, energy);
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === tempId ? { ...serverTask, subtasks: t.subtasks } : t
            ),
          }));
        } catch (err: any) {
          console.warn('Quick capture background sync failed (lưu tạm offline):', err?.message);
        }
      },

      /**
       * 3. moveTask(taskId, targetStatus): Chuyển cột trên UI; đồng thời gọi TaskService (PATCH /api/v1/tasks/{id}/status).
       * Nếu server trả về 409 Conflict (WIP Limit), tự động rollback vị trí và kích hoạt NotificationToast.
       */
      moveTask: async (taskId: string, targetStatus: TaskStatus): Promise<boolean> => {
        const state = get();
        const currentTask = state.tasks.find((t) => t.id === taskId);
        if (!currentTask || currentTask.status === targetStatus) {
          return true;
        }

        const previousTasks = [...state.tasks];

        // 1. Chuyển cột trên UI (Optimistic update)
        set({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: targetStatus,
                  completedAt: targetStatus === 'DONE' ? new Date().toISOString() : undefined,
                }
              : t
          ),
        });

        if (targetStatus === 'DONE' && Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // 2. Gọi ngầm TaskService.updateTaskStatus
        try {
          const updated = await TaskService.updateTaskStatus(taskId, targetStatus);
          set((curr) => ({
            tasks: curr.tasks.map((t) =>
              t.id === taskId ? { ...updated, subtasks: t.subtasks } : t
            ),
          }));

          // Nếu hoàn thành task sang DONE, đồng bộ lại điểm XP và Streak
          if (targetStatus === 'DONE') {
            get().fetchStreak();
          }

          return true;
        } catch (err: any) {
          const isWipConflict =
            err?.response?.status === 409 ||
            err?.status === 409 ||
            (typeof err?.message === 'string' && err.message.includes('409'));

          // Nếu server trả về 409 Conflict (WIP Limit): Rollback & Toast
          if (isWipConflict) {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }

            const empatheticMessage =
              err?.response?.data?.message ||
              '🎯 ĐƠN NHIỆM LÀ SIÊU NĂNG LỰC CỦA BẠN!\nBạn đang có 1 nhiệm vụ trong cột "Đang làm". Hãy hoàn thành dứt điểm hoặc đưa về Cần làm trước nhé!';

            set({
              tasks: previousTasks,
              rollbackTaskId: taskId,
              toast: {
                visible: true,
                message: empatheticMessage,
                type: 'warning',
              },
            });

            // Tự động giải phóng trạng thái rollback sau 800ms (chu kỳ spring physics)
            setTimeout(() => {
              set({ rollbackTaskId: null });
            }, 800);

            return false;
          }

          // Kiểm tra WIP cục bộ nếu đang ở chế độ ngoại tuyến hoàn toàn
          const activeDoingTasks = previousTasks.filter(
            (t) => t.status === 'DOING' && t.id !== taskId
          );
          if (targetStatus === 'DOING' && activeDoingTasks.length >= 1) {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            set({
              tasks: previousTasks,
              rollbackTaskId: taskId,
              toast: {
                visible: true,
                message: `🎯 ĐƠN NHIỆM LÀ SIÊU NĂNG LỰC CỦA BẠN!\nBạn đang làm "${activeDoingTasks[0].title}". Hãy hoàn thành dứt điểm hoặc đưa việc hiện tại về Cần làm trước nhé!`,
                type: 'warning',
              },
            });

            setTimeout(() => {
              set({ rollbackTaskId: null });
            }, 800);

            return false;
          }

          // Nếu chỉ là lỗi kết nối mạng thông thường: bảo lưu cập nhật lạc quan trong cache
          console.warn('moveTask offline sync: đã ghi nhận thay đổi vào cache thiết bị', err?.message);
          return true;
        }
      },

      /**
       * 4. toggleSubtask(taskId, subtaskId): Cập nhật trạng thái hoàn thành vi bước.
       * - Phản hồi xúc giác Medium impact (Dopamine Ignition tức thì)
       * - Optimistic Update trên UI
       * - Gọi API PATCH /api/v1/tasks/{taskId}/subtasks/{subtaskId}/toggle ngầm
       */
      toggleSubtask: async (taskId: string, subtaskId: string) => {
        // Dopamine Ignition haptic feedback ngay tức thì (<50ms)
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Cập nhật lạc quan (Optimistic update)
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updatedSubtasks = t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
            );
            return {
              ...t,
              subtasks: updatedSubtasks,
            };
          }),
        }));

        // Gọi API đồng bộ ngầm lên server
        try {
          await TaskService.toggleSubtask(taskId, subtaskId);
          // Cập nhật lại streak/XP vì backend thưởng +5 XP cho mỗi vi bước hoàn thành
          get().fetchStreak();
        } catch (err: any) {
          console.warn('toggleSubtask offline sync (bảo lưu trạng thái local):', err?.message);
        }
      },

      /**
       * Áp dụng các vi bước được đề xuất từ AI Decomposition:
       * - Gọi API TaskService.applySubtasks để lưu bulk vào Database
       * - Đồng bộ dữ liệu có server UUID vào Zustand và TaskCard
       */
      applySubtasks: async (taskId: string, newSubtasks: Subtask[]) => {
        const totalMinutes = newSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

        // Cập nhật lạc quan: thiết lập danh sách vi bước mới đã được phê duyệt
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: newSubtasks,
              estimatedMinutes: totalMinutes > 0 ? totalMinutes : t.estimatedMinutes,
            };
          }),
        }));

        // Gọi đồng bộ lên server
        try {
          const result = await TaskService.applySubtasks(taskId, newSubtasks);
          set((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                subtasks: result.subtasks,
                estimatedMinutes: result.task.estimatedMinutes ?? t.estimatedMinutes,
              };
            }),
            toast: {
              visible: true,
              message: '✨ Đã lưu các vi bước vào nhiệm vụ thành công!',
              type: 'success',
            },
          }));
        } catch (err: any) {
          console.warn('applySubtasks offline sync (bảo lưu cục bộ):', err?.message);
          set({
            toast: {
              visible: true,
              message: '🌿 Đã lưu tạm các vi bước trên thiết bị.',
              type: 'info',
            },
          });
        }
      },

      /**
       * Hoàn thành toàn bộ task (từ FocusScreen hoặc nút hoàn thành)
       */
      completeTask: async (taskId: string) => {
        // Đánh dấu xong toàn bộ subtasks trong local state trước
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) => ({ ...s, isCompleted: true })),
                }
              : t
          ),
        }));

        // Gọi moveTask để thực hiện optimistic update chuyển sang DONE, trigger Haptics và gọi API backend
        await get().moveTask(taskId, 'DONE');
      },

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
      }),
    }
  )
);
