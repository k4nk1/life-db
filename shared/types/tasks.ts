export type TaskStatus = 'not_started' | 'completed' | string;
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface Task {
  id: number;
  title: string;
  detail: string | null;
  weight: number;
  deadline: string | Date | null;
  status: string;
  completedAt: string | Date | null;
  parentTaskId: number | null;
}

export interface TaskItem extends Task {
  totalWeight: number;
}

export interface CreateTaskRequest {
  title: string;
  detail?: string | null | undefined;
  weight?: number | undefined;
  deadline?: string | Date | null | undefined;
  status?: string | undefined;
  parentTaskId?: number | null | undefined;
}

export interface UpdateTaskRequest {
  title?: string | undefined;
  detail?: string | null | undefined;
  weight?: number | undefined;
  deadline?: string | Date | null | undefined;
  status?: string | undefined;
  parentTaskId?: number | null | undefined;
}

export interface GetTasksResponse {
  items: TaskItem[];
  total: number;
}

export interface CompletedStatsResponse {
  count: number;
  totalWeight: number;
  tasks?: TaskItem[] | undefined;
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
  detail?: string | null | undefined;
  weight?: number | undefined;
  repeatType: string;
  repeatTime?: string | null | undefined;
  repeatDays?: string | null | undefined;
  deadlineOffset?: number | null | undefined;
}

export interface UpdateRecurringTaskRequest {
  title?: string | undefined;
  detail?: string | null | undefined;
  weight?: number | undefined;
  repeatType?: string | undefined;
  repeatTime?: string | null | undefined;
  repeatDays?: string | null | undefined;
  deadlineOffset?: number | null | undefined;
}
