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
  applySubtasks: async (taskId: string, subtasks: Subtask[]): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<TaskResponse> | TaskResponse>(
      `/tasks/${taskId}/subtasks/bulk`,
      { subtasks }
    );

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);
    return mapTaskResponseToTask(item, subtasks);
  },
};
