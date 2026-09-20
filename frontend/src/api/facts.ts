import axios from 'axios';
import type {
  Tag,
  FactSupplement,
  FactEntryItem,
  GetFactsResponse,
  CreateFactEntryRequest,
  UpdateFactEntryRequest,
  CreateSupplementRequest,
  UpdateSupplementRequest,
  RandomFactResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from '../../../shared/types/facts';

const client = axios.create({
  baseURL: '/api/facts',
});

export const factsApi = {
  // エントリー一覧（検索・タグフィルタ・ページネーション）
  getFacts: async (params?: {
    page?: number;
    limit?: number;
    tags?: string;
    search?: string;
  }): Promise<GetFactsResponse> => {
    const res = await client.get<GetFactsResponse>('/', { params });
    return res.data;
  },

  // エントリー作成
  createFact: async (data: CreateFactEntryRequest): Promise<FactEntryItem> => {
    const res = await client.post<FactEntryItem>('/', data);
    return res.data;
  },

  // エントリー更新
  updateFact: async (id: number, data: UpdateFactEntryRequest): Promise<FactEntryItem> => {
    const res = await client.put<FactEntryItem>(`/${id}`, data);
    return res.data;
  },

  // エントリー削除
  deleteFact: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/${id}`);
    return res.data;
  },

  // 補足追加
  createSupplement: async (
    entryId: number,
    data: CreateSupplementRequest
  ): Promise<FactSupplement> => {
    const res = await client.post<FactSupplement>(`/${entryId}/supplements`, data);
    return res.data;
  },

  // 補足更新
  updateSupplement: async (
    supplementId: number,
    data: UpdateSupplementRequest
  ): Promise<FactSupplement> => {
    const res = await client.put<FactSupplement>(`/supplements/${supplementId}`, data);
    return res.data;
  },

  // 補足削除
  deleteSupplement: async (supplementId: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/supplements/${supplementId}`);
    return res.data;
  },

  // ランダム取得
  getRandomFact: async (): Promise<RandomFactResponse | null> => {
    const res = await client.get<RandomFactResponse | null>('/random');
    return res.data;
  },

  // タグ一覧
  getTags: async (): Promise<Tag[]> => {
    const res = await client.get<Tag[]>('/tags');
    return res.data;
  },

  // タグ作成
  createTag: async (data: CreateTagRequest): Promise<Tag> => {
    const res = await client.post<Tag>('/tags', data);
    return res.data;
  },

  // タグ更新
  updateTag: async (id: number, data: UpdateTagRequest): Promise<Tag> => {
    const res = await client.put<Tag>(`/tags/${id}`, data);
    return res.data;
  },

  // タグ削除
  deleteTag: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/tags/${id}`);
    return res.data;
  },
};
