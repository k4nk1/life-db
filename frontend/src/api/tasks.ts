import axios from 'axios';
import type {
  TaskItem,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksResponse,
  CompletedStatsResponse,
  RecurringTask,
  CreateRecurringTaskRequest,
  UpdateRecurringTaskRequest,
} from '../../../shared/types/tasks';

const client = axios.create({
  baseURL: '/api/tasks',
});

export const tasksApi = {
  // タスク一覧（ルート / 検索）
  getTasks: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    status?: string;
    deadlineBefore?: string;
  }): Promise<GetTasksResponse> => {
    const res = await client.get<GetTasksResponse>('/', { params });
    return res.data;
  },

  // 子タスク一覧取得
  getChildTasks: async (parentTaskId: number): Promise<TaskItem[]> => {
    const res = await client.get<TaskItem[]>('/', {
      params: { parentTaskId },
    });
    return res.data;
  },

  // タスク作成
  createTask: async (data: CreateTaskRequest): Promise<TaskItem> => {
    const res = await client.post<TaskItem>('/', data);
    return res.data;
  },

  // タスク更新
  updateTask: async (id: number, data: UpdateTaskRequest): Promise<TaskItem> => {
    const res = await client.put<TaskItem>(`/${id}`, data);
    return res.data;
  },

  // タスク削除
  deleteTask: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/${id}`);
    return res.data;
  },

  // 完了履歴統計
  getCompletedStats: async (start: string, end: string): Promise<CompletedStatsResponse> => {
    const res = await client.get<CompletedStatsResponse>('/completed-stats', {
      params: { start, end },
    });
    return res.data;
  },

  // 繰り返しタスク一覧
  getRecurringTasks: async (): Promise<RecurringTask[]> => {
    const res = await client.get<RecurringTask[]>('/recurring');
    return res.data;
  },

  // 繰り返しタスク作成
  createRecurringTask: async (data: CreateRecurringTaskRequest): Promise<RecurringTask> => {
    const res = await client.post<RecurringTask>('/recurring', data);
    return res.data;
  },

  // 繰り返しタスク更新
  updateRecurringTask: async (id: number, data: UpdateRecurringTaskRequest): Promise<RecurringTask> => {
    const res = await client.put<RecurringTask>(`/recurring/${id}`, data);
    return res.data;
  },

  // 繰り返しタスク削除
  deleteRecurringTask: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/recurring/${id}`);
    return res.data;
  },

  // 繰り返しタスク手動トリガー
  triggerRecurringTask: async (id: number): Promise<TaskItem> => {
    const res = await client.post<TaskItem>(`/recurring/${id}/trigger`);
    return res.data;
  },
};
