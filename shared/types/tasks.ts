export type TaskStatus = 'not_started' | 'completed' | string;
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface Task {
  id: number;
  title: string;
  detail: string | null;
  weight: number;
  deadline: string | null;
  status: string;
  completedAt: string | null;
  parentTaskId: number | null;
}

export interface TaskItem extends Task {
  totalWeight: number;
}

export interface CreateTaskRequest {
  title: string;
  detail?: string | null;
  weight?: number;
  deadline?: string | null;
  status?: string;
  parentTaskId?: number | null;
}

export interface UpdateTaskRequest {
  title?: string;
  detail?: string | null;
  weight?: number;
  deadline?: string | null;
  status?: string;
  parentTaskId?: number | null;
}

export interface GetTasksResponse {
  items: TaskItem[];
  total: number;
}

export interface CompletedStatsResponse {
  count: number;
  totalWeight: number;
}

export interface RecurringTask {
  id: number;
  title: string;
  detail: string | null;
  weight: number;
  repeatType: string;
  repeatTime: string | null;
  repeatDays: string | null;
  deadlineOffset: number | null;
}

export interface CreateRecurringTaskRequest {
  title: string;
  detail?: string | null;
  weight?: number;
  repeatType: string;
  repeatTime?: string | null;
  repeatDays?: string | null;
  deadlineOffset?: number | null;
}

export interface UpdateRecurringTaskRequest {
  title?: string;
  detail?: string | null;
  weight?: number;
  repeatType?: string;
  repeatTime?: string | null;
  repeatDays?: string | null;
  deadlineOffset?: number | null;
}
