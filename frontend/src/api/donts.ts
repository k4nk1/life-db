import axios from 'axios';
import type {
  DontEntryItem,
  DontEntry,
  DontReview,
  CreateDontEntryRequest,
  UpdateDontEntryRequest,
  UpdateDontReviewRequest,
} from '../../../shared/types/donts';

const client = axios.create({
  baseURL: '/api/donts',
});

export const dontsApi = {
  // エントリー一覧（週フィルタ、振り返り付き）
  getEntries: async (weekStart?: string): Promise<DontEntryItem[]> => {
    const res = await client.get<DontEntryItem[]>('/', {
      params: weekStart ? { weekStart } : undefined,
    });
    return res.data;
  },

  // エントリー作成
  createEntry: async (data: CreateDontEntryRequest): Promise<DontEntry> => {
    const res = await client.post<DontEntry>('/', data);
    return res.data;
  },

  // エントリー更新
  updateEntry: async (id: number, data: UpdateDontEntryRequest): Promise<DontEntry> => {
    const res = await client.put<DontEntry>(`/${id}`, data);
    return res.data;
  },

  // エントリー削除
  deleteEntry: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/${id}`);
    return res.data;
  },

  // 振り返り作成・更新（upsert）
  upsertReview: async (
    id: number,
    weekStart: string,
    data: UpdateDontReviewRequest
  ): Promise<DontReview> => {
    const res = await client.put<DontReview>(`/${id}/reviews/${weekStart}`, data);
    return res.data;
  },
};
