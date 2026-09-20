import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  Transaction,
  GetTransactionsParams,
  GetTransactionsResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  AssetStatsResponse,
} from '../../../shared/types/assets';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const defaultDbPath = path.resolve(__dirname, '../../prisma/dev.db');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl === 'file:./dev.db') {
  databaseUrl = `file:${defaultDbPath}`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export { prisma };

export const assetsService = {
  // 取引一覧（ページネーション・フィルタ）
  async getTransactions(params: GetTransactionsParams): Promise<GetTransactionsResponse> {
    const where: any = {};

    if (params.start || params.end) {
      where.date = {};
      if (params.start) {
        where.date.gte = new Date(`${params.start}T00:00:00.000`);
      }
      if (params.end) {
        where.date.lte = new Date(`${params.end}T23:59:59.999`);
      }
    }

    if (params.type === 'income') {
      where.amount = { gt: 0 };
    } else if (params.type === 'expense') {
      where.amount = { lt: 0 };
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 50);
    const skip = (page - 1) * limit;
    const take = limit;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  },

  // 単一取引取得
  async getTransactionById(id: number): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  },

  // 取引作成
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    return prisma.transaction.create({
      data: {
        date: new Date(data.date),
        amount: Number(data.amount),
        detail: data.detail ?? null,
      },
    });
  },

  // 取引更新
  async updateTransaction(id: number, data: UpdateTransactionRequest): Promise<Transaction> {
    const updateData: any = {};
    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
    }
    if (data.amount !== undefined) {
      updateData.amount = Number(data.amount);
    }
    if (data.detail !== undefined) {
      updateData.detail = data.detail;
    }

    return prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  },

  // 取引削除
  async deleteTransaction(id: number): Promise<{ success: boolean }> {
    await prisma.transaction.delete({
      where: { id },
    });
    return { success: true };
  },

  // 収支の集計値を取得
  async getStats(start?: string, end?: string): Promise<AssetStatsResponse> {
    const where: any = {};

    if (start || end) {
      where.date = {};
      if (start) {
        where.date.gte = new Date(`${start}T00:00:00.000`);
      }
      if (end) {
        where.date.lte = new Date(`${end}T23:59:59.999`);
      }
    }

    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...where,
          amount: { gt: 0 },
        },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          ...where,
          amount: { lt: 0 },
        },
      }),
    ]);

    const incomeTotal = incomeAgg._sum.amount ?? 0;
    const expenseTotal = expenseAgg._sum.amount ?? 0;
    const netProfit = incomeTotal + expenseTotal;

    return {
      incomeTotal,
      expenseTotal,
      netProfit,
    };
  },
};
