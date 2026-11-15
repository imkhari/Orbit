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
  UpdateTaskRequest,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  UserProfile,
  BoardResponse,
  CreateBoardRequest,
  UpdateBoardRequest,
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

// Request interceptor: tự động gắn Timezone header và JWT Bearer Token
apiClient.interceptors.request.use((config) => {
  try {
    // 1. Gắn Timezone client để bảo vệ chuỗi ngày Streak theo giờ địa phương
    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
    config.headers['X-Timezone-Offset'] = clientTz;

    // 2. Gắn JWT Bearer token nếu đã đăng nhập
    const { useAuthStore } = require('../store/useAuthStore');
    const token = useAuthStore.getState()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

/**
 * Hàm trợ giúp chuyển đổi TaskResponse từ Backend Spring Boot sang Task domain model trên Mobile.
 */
export const mapTaskResponseToTask = (
  res: TaskResponse,
  existingSubtasks: Subtask[] = []
): Task => {
  const mappedSubtasks: Subtask[] = (res.subtasks ?? []).map((s) => ({
    id: s.id,
    taskId: s.taskId || res.id,
    title: s.title,
    estimatedMinutes: s.estimatedMinutes ?? 15,
    energyLevel: s.energyLevel ?? 'LOW',
    stepOrder: s.stepOrder ?? 1,
    isCompleted: Boolean(s.isCompleted),
    completedAt: s.completedAt,
  }));

  return {
    id: res.id,
    boardId: res.boardId || 'board-main',
    title: res.title,
    description: res.description,
    status: res.status,
    urgency: res.urgency,
    energyRequired: res.energyRequired,
    deadline: res.deadline,
    estimatedMinutes: res.estimatedMinutes,
    position: res.position ?? 0,
    subtasks: existingSubtasks.length > 0 ? existingSubtasks : mappedSubtasks,
    createdAt: res.createdAt,
    completedAt: res.completedAt,
  };
};

export const TaskService = {
  /**
   * Lấy danh sách nhiệm vụ từ backend (GET /api/v1/tasks?boardId=...)
   */
  getTasks: async (status?: TaskStatus, boardId?: string): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<TaskResponse[]> | TaskResponse[]>('/tasks', {
      params: {
        ...(status ? { status } : {}),
        ...(boardId ? { boardId } : {}),
      },
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
  quickCapture: async (
    title: string,
    energyLevel: EnergyLevel = 'MEDIUM',
    description?: string,
    boardId?: string
  ): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<TaskResponse> | TaskResponse>('/tasks', {
      title,
      energyRequired: energyLevel,
      description,
      boardId,
    });

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);
    return mapTaskResponseToTask(item);
  },

  /**
   * Cập nhật thông tin chi tiết nhiệm vụ (PUT /api/v1/tasks/{id})
   */
  updateTask: async (taskId: string, updates: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<TaskResponse> | TaskResponse>(
      `/tasks/${taskId}`,
      updates
    );

    const item: TaskResponse = (response.data as ApiResponse<TaskResponse>)?.data ?? (response.data as TaskResponse);
    return mapTaskResponseToTask(item);
  },

  /**
   * Xóa vĩnh viễn nhiệm vụ (DELETE /api/v1/tasks/{id})
   */
  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
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

export const AuthService = {
  /**
   * Đăng ký tài khoản người dùng mới (POST /api/v1/auth/register)
   */
  register: async (req: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse> | AuthResponse>(
      '/auth/register',
      req
    );
    return (response.data as ApiResponse<AuthResponse>)?.data ?? (response.data as AuthResponse);
  },

  /**
   * Đăng nhập người dùng (POST /api/v1/auth/login)
   */
  login: async (req: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse> | AuthResponse>(
      '/auth/login',
      req
    );
    return (response.data as ApiResponse<AuthResponse>)?.data ?? (response.data as AuthResponse);
  },

  /**
   * Làm mới Access Token (POST /api/v1/auth/refresh)
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse> | AuthResponse>(
      '/auth/refresh',
      { refreshToken }
    );
    return (response.data as ApiResponse<AuthResponse>)?.data ?? (response.data as AuthResponse);
  },

  /**
   * Lấy thông tin người dùng hiện tại (GET /api/v1/auth/me)
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile> | UserProfile>(
      '/auth/me'
    );
    return (response.data as ApiResponse<UserProfile>)?.data ?? (response.data as UserProfile);
  },

  /**
   * Cập nhật mức năng lượng hiện tại của người dùng (PATCH /api/v1/auth/me/energy)
   */
  updateEnergyLevel: async (energyLevel: EnergyLevel): Promise<UserProfile> => {
    const response = await apiClient.patch<ApiResponse<UserProfile> | UserProfile>(
      '/auth/me/energy',
      { energyLevel }
    );
    return (response.data as ApiResponse<UserProfile>)?.data ?? (response.data as UserProfile);
  },
};

export const BoardService = {
  /**
   * Lấy danh sách các bảng hoạt động của người dùng (GET /api/v1/boards)
   */
  getBoards: async (): Promise<BoardResponse[]> => {
    const response = await apiClient.get<ApiResponse<BoardResponse[]> | BoardResponse[]>('/boards');
    const rawList: BoardResponse[] = Array.isArray(response.data)
      ? response.data
      : (response.data as ApiResponse<BoardResponse[]>)?.data ?? [];
    return rawList;
  },

  /**
   * Tạo bảng mới (POST /api/v1/boards) - giới hạn 5 bảng (Edge Case 07)
   */
  createBoard: async (data: CreateBoardRequest): Promise<BoardResponse> => {
    const response = await apiClient.post<ApiResponse<BoardResponse> | BoardResponse>('/boards', data);
    return (response.data as ApiResponse<BoardResponse>)?.data ?? (response.data as BoardResponse);
  },

  /**
   * Cập nhật thông tin bảng (PUT /api/v1/boards/{id})
   */
  updateBoard: async (boardId: string, data: UpdateBoardRequest): Promise<BoardResponse> => {
    const response = await apiClient.put<ApiResponse<BoardResponse> | BoardResponse>(`/boards/${boardId}`, data);
    return (response.data as ApiResponse<BoardResponse>)?.data ?? (response.data as BoardResponse);
  },

  /**
   * Lưu trữ bảng để giải phóng không gian (PATCH /api/v1/boards/{id}/archive)
   */
  archiveBoard: async (boardId: string): Promise<BoardResponse> => {
    const response = await apiClient.patch<ApiResponse<BoardResponse> | BoardResponse>(`/boards/${boardId}/archive`);
    return (response.data as ApiResponse<BoardResponse>)?.data ?? (response.data as BoardResponse);
  },

  /**
   * Xóa vĩnh viễn bảng (DELETE /api/v1/boards/{id})
   */
  deleteBoard: async (boardId: string): Promise<void> => {
    await apiClient.delete(`/boards/${boardId}`);
  },
};

