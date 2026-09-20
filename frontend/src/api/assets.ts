import axios from 'axios';
import type {
  Transaction,
  GetTransactionsParams,
  GetTransactionsResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  AssetStatsResponse,
} from '../../../shared/types/assets';

const client = axios.create({
  baseURL: '/api/assets',
});

export const assetsApi = {
  // 取引一覧（ページネーション・フィルタ）
  getTransactions: async (params?: GetTransactionsParams): Promise<GetTransactionsResponse> => {
    const res = await client.get<GetTransactionsResponse>('/transactions', {
      params,
    });
    return res.data;
  },

  // 取引作成
  createTransaction: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const res = await client.post<Transaction>('/transactions', data);
    return res.data;
  },

  // 取引更新
  updateTransaction: async (
    id: number,
    data: UpdateTransactionRequest
  ): Promise<Transaction> => {
    const res = await client.put<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },

  // 取引削除
  deleteTransaction: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/transactions/${id}`);
    return res.data;
  },

  // 収支統計取得
  getStats: async (start?: string, end?: string): Promise<AssetStatsResponse> => {
    const res = await client.get<AssetStatsResponse>('/stats', {
      params: { start, end },
    });
    return res.data;
  },
};
