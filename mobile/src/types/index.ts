export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'DOING' | 'DONE';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  currentEnergyLevel: EnergyLevel;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  estimatedMinutes: number;
  energyLevel: EnergyLevel;
  stepOrder: number;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  urgency: UrgencyLevel;
  energyRequired: EnergyLevel;
  deadline?: string;
  estimatedMinutes?: number;
  position: number;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export interface KanbanColumn {
  id: string;
  type: TaskStatus;
  title: string;
  wipLimit?: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  icon: string;
  columns: KanbanColumn[];
}

export interface AIDecomposeResponse {
  taskId: string;
  estimatedTotalMinutes: number;
  suggestedSubtasks: Array<{
    stepOrder: number;
    title: string;
    estimatedMinutes: number;
    energyLevel: EnergyLevel;
  }>;
}
