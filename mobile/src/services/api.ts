import axios from 'axios';
import { Platform } from 'react-native';
import {
  Task,
  AIDecomposeResponse,
  EnergyLevel,
  Subtask,
  TaskStatus,
  ApiResponse,
  TaskResponse,
  SubtaskResponse,
  StreakResponse,
  FocusSessionResponse,
  LogFocusSessionRequest,
} from '../types';

/**
 * Cấu hình API Base URL thích ứng đa nền tảng:
 * - Trên Android Emulator: 10.0.2.2 trỏ về localhost máy tính host
 * - Trên iOS Simulator / Web: localhost:8080
 * - Cho phép ghi đè qua biến môi trường EXPO_PUBLIC_API_URL
 */
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }
  return 'http://localhost:8080/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Hàm trợ giúp chuyển đổi TaskResponse từ Backend Spring Boot sang Task domain model trên Mobile.
 */
export const mapTaskResponseToTask = (
  res: TaskResponse,
  existingSubtasks: Subtask[] = []
): Task => ({
  id: res.id,
  boardId: 'board-main',
  title: res.title,
  description: res.description,
  status: res.status,
  urgency: res.urgency,
  energyRequired: res.energyRequired,
  deadline: res.deadline,
  estimatedMinutes: res.estimatedMinutes,
  position: res.position ?? 0,
  subtasks: existingSubtasks,
  createdAt: res.createdAt,
  completedAt: res.completedAt,
});

export const TaskService = {
  /**
   * Lấy danh sách nhiệm vụ từ backend (GET /api/v1/tasks)
   */
  getTasks: async (status?: TaskStatus): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<TaskResponse[]> | TaskResponse[]>('/tasks', {
      params: status ? { status } : undefined,
    });

    const rawList: TaskResponse[] = Array.isArray(response.data)
      ? response.data
      : (response.data as ApiResponse<TaskResponse[]>)?.data ?? [];

    return rawList.map((item) => mapTaskResponseToTask(item));
  },

  /**
   * Lấy danh sách vi bước của một nhiệm vụ (GET /api/v1/tasks/{id}/subtasks)
   */
  getSubtasks: async (taskId: string): Promise<Subtask[]> => {
    const response = await apiClient.get<ApiResponse<SubtaskResponse[]> | SubtaskResponse[]>(
      `/tasks/${taskId}/subtasks`
    );

    const rawList: SubtaskResponse[] = Array.isArray(response.data)
      ? response.data
      : (response.data as ApiResponse<SubtaskResponse[]>)?.data ?? [];

    return rawList.map((item) => ({
      id: item.id,
      taskId: item.taskId,
      title: item.title,
      estimatedMinutes: item.estimatedMinutes ?? 15,
      energyLevel: item.energyLevel ?? 'LOW',
      stepOrder: item.stepOrder ?? 1,
      isCompleted: Boolean(item.isCompleted),
      completedAt: item.completedAt,
    }));
  },

  /**
   * Quick Capture: Ghi nhận nhanh việc dưới 5 giây (POST /api/v1/tasks)
   */
  quickCapture: async (title: string, energyLevel: EnergyLevel = 'MEDIUM'): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<TaskResponse> | TaskResponse>('/tasks', {
      title,
      energyRequired: energyLevel,
    });

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);
    return mapTaskResponseToTask(item);
  },

  /**
   * Cập nhật trạng thái cột Kanban của nhiệm vụ (PATCH /api/v1/tasks/{id}/status)
   */
  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<TaskResponse> | TaskResponse>(
      `/tasks/${taskId}/status`,
      { status }
    );

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);
    return mapTaskResponseToTask(item);
  },

  /**
   * AI Task Decomposition: Yêu cầu AI Gemini bẻ nhỏ việc lớn (POST /api/v1/tasks/{id}/ai-decompose)
   */
  decomposeWithAI: async (taskId: string): Promise<AIDecomposeResponse> => {
    const response = await apiClient.post<ApiResponse<AIDecomposeResponse> | AIDecomposeResponse>(
      `/tasks/${taskId}/ai-decompose`
    );

    return (response.data as ApiResponse<AIDecomposeResponse>)?.data ?? (response.data as AIDecomposeResponse);
  },

  /**
   * Áp dụng danh sách subtasks sau khi người dùng duyệt (POST /api/v1/tasks/{id}/subtasks/bulk)
   */
  applySubtasks: async (
    taskId: string,
    subtasks: Array<{
      id?: string;
      title: string;
      estimatedMinutes?: number;
      energyLevel?: EnergyLevel;
      stepOrder?: number;
      isCompleted?: boolean;
    }>
  ): Promise<{ task: Task; subtasks: Subtask[] }> => {
    const payload = {
      subtasks: subtasks.map((s, idx) => ({
        title: s.title.trim(),
        estimatedMinutes: s.estimatedMinutes ?? 15,
        energyLevel: s.energyLevel ?? 'LOW',
        stepOrder: s.stepOrder ?? idx + 1,
        isCompleted: Boolean(s.isCompleted),
      })),
    };

    const response = await apiClient.post<ApiResponse<TaskResponse> | TaskResponse>(
      `/tasks/${taskId}/subtasks/bulk`,
      payload
    );

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);

    // Cố gắng lấy danh sách subtasks thực tế vừa tạo trên server (có UUID chuẩn)
    let savedSubtasks: Subtask[] = [];
    try {
      savedSubtasks = await TaskService.getSubtasks(taskId);
    } catch {
      savedSubtasks = subtasks.map((s, idx) => ({
        id: s.id || `subtask-${Date.now()}-${idx}`,
        taskId,
        title: s.title,
        estimatedMinutes: s.estimatedMinutes ?? 15,
        energyLevel: s.energyLevel ?? 'LOW',
        stepOrder: s.stepOrder ?? idx + 1,
        isCompleted: Boolean(s.isCompleted),
      }));
    }

    const task = mapTaskResponseToTask(item, savedSubtasks);
    return { task, subtasks: savedSubtasks };
  },

  /**
   * Đánh dấu hoàn thành / chưa hoàn thành vi bước con (PATCH /api/v1/tasks/{taskId}/subtasks/{subtaskId}/toggle)
   */
  toggleSubtask: async (taskId: string, subtaskId: string): Promise<SubtaskResponse> => {
    const response = await apiClient.patch<ApiResponse<SubtaskResponse> | SubtaskResponse>(
      `/tasks/${taskId}/subtasks/${subtaskId}/toggle`
    );

    return (response.data as ApiResponse<SubtaskResponse>)?.data ?? (response.data as SubtaskResponse);
  },
};

export const StreakService = {
  /**
   * Lấy thông tin chuỗi ngày liên tiếp, Khiên Đóng Băng và XP (GET /api/v1/users/me/streak)
   */
  getStreak: async (): Promise<StreakResponse> => {
    const response = await apiClient.get<ApiResponse<StreakResponse> | StreakResponse>(
      '/users/me/streak'
    );

    return (response.data as ApiResponse<StreakResponse>)?.data ?? (response.data as StreakResponse);
  },
};

export const FocusSessionService = {
  /**
   * Ghi nhận phiên tập trung Pomodoro (25m) và cộng XP (POST /api/v1/focus/sessions)
   */
  logSession: async (request: LogFocusSessionRequest): Promise<FocusSessionResponse> => {
    const response = await apiClient.post<ApiResponse<FocusSessionResponse> | FocusSessionResponse>(
      '/focus/sessions',
      request
    );

    return (response.data as ApiResponse<FocusSessionResponse>)?.data ?? (response.data as FocusSessionResponse);
  },
};
