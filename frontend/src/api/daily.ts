import axios from 'axios';
import type {
  DailyRecord,
  DailyStats,
  ActionType,
  ActionSubtype,
  Action,
  UpdateDailyRecordRequest,
  CreateActionRequest,
  UpdateActionRequest,
  CreateActionTypeRequest,
  UpdateActionTypeRequest,
  CreateActionSubtypeRequest,
  UpdateActionSubtypeRequest,
} from '../../../shared/types/daily';

const client = axios.create({
  baseURL: '/api/daily',
});

export const dailyApi = {
  // Records
  getRecord: async (date: string): Promise<DailyRecord> => {
    const res = await client.get<DailyRecord>(`/records/${date}`);
    return res.data;
  },
  updateRecord: async (date: string, data: UpdateDailyRecordRequest): Promise<DailyRecord> => {
    const res = await client.put<DailyRecord>(`/records/${date}`, data);
    return res.data;
  },

  // Actions
  createAction: async (date: string, data: CreateActionRequest): Promise<Action> => {
    const res = await client.post<Action>(`/records/${date}/actions`, data);
    return res.data;
  },
  updateAction: async (id: number, data: UpdateActionRequest): Promise<Action> => {
    const res = await client.put<Action>(`/actions/${id}`, data);
    return res.data;
  },
  deleteAction: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/actions/${id}`);
    return res.data;
  },

  // Stats
  getStats: async (start: string, end: string, groupBy: 'type' | 'subtype'): Promise<DailyStats[]> => {
    const res = await client.get<DailyStats[]>('/stats', {
      params: { start, end, groupBy },
    });
    return res.data;
  },

  // Types
  getTypes: async (): Promise<ActionType[]> => {
    const res = await client.get<ActionType[]>('/types');
    return res.data;
  },
  createType: async (data: CreateActionTypeRequest): Promise<ActionType> => {
    const res = await client.post<ActionType>('/types', data);
    return res.data;
  },
  updateType: async (id: number, data: UpdateActionTypeRequest): Promise<ActionType> => {
    const res = await client.put<ActionType>(`/types/${id}`, data);
    return res.data;
  },
  deleteType: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/types/${id}`);
    return res.data;
  },

  // Subtypes
  createSubtype: async (data: CreateActionSubtypeRequest): Promise<ActionSubtype> => {
    const res = await client.post<ActionSubtype>('/subtypes', data);
    return res.data;
  },
  updateSubtype: async (id: number, data: UpdateActionSubtypeRequest): Promise<ActionSubtype> => {
    const res = await client.put<ActionSubtype>(`/subtypes/${id}`, data);
    return res.data;
  },
  deleteSubtype: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/subtypes/${id}`);
    return res.data;
  },
};
