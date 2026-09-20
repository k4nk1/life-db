export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  date: string | Date;
  amount: number;
  detail: string | null;
}

export interface GetTransactionsParams {
  start?: string | undefined;
  end?: string | undefined;
  type?: TransactionType | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface GetTransactionsResponse {
  items: Transaction[];
  total: number;
}

export interface CreateTransactionRequest {
  date: string | Date;
  amount: number;
  detail?: string | null | undefined;
}

export interface UpdateTransactionRequest {
  date?: string | Date | undefined;
  amount?: number | undefined;
  detail?: string | null | undefined;
}

export interface GetStatsParams {
  start?: string | undefined;
  end?: string | undefined;
}

export interface AssetStatsResponse {
  incomeTotal: number;
  expenseTotal: number;
  netProfit: number;
}
