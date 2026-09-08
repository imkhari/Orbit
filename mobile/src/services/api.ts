import axios from 'axios';
import { Task, AIDecomposeResponse, EnergyLevel } from '../types';

// Default to localhost for local testing (use 10.0.2.2 for Android emulator)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TaskService = {
  // Quick Capture: Ghi nhận nhanh việc dưới 5 giây
  quickCapture: async (title: string, energyLevel: EnergyLevel = 'MEDIUM'): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks/quick-capture', {
      title,
      energyRequired: energyLevel,
    });
    return response.data;
  },

  // AI Task Decomposition: Yêu cầu AI bẻ nhỏ việc lớn
  decomposeWithAI: async (taskId: string): Promise<AIDecomposeResponse> => {
    const response = await apiClient.post<AIDecomposeResponse>(`/tasks/${taskId}/ai-decompose`);
    return response.data;
  },

  // Apply subtasks sau khi người dùng đã duyệt
  applySubtasks: async (taskId: string, subtasks: any[]): Promise<Task> => {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/subtasks/bulk`, { subtasks });
    return response.data;
  },
};
