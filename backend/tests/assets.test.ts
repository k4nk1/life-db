import path from 'path';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';

const testDbPath = path.resolve(__dirname, '../prisma/test.db');
process.env.DATABASE_URL = `file:${testDbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

import { assetsService } from '../src/services/assets';
import assetsRouter from '../src/routes/assets';

describe('Assets Service & Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/assets', assetsRouter);

  beforeAll(async () => {
    await prisma.transaction.deleteMany();
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.$disconnect();
  });

  describe('Service: CRUD & Stats logic', () => {
    let incomeId: number;
    let expenseId: number;
    let zeroId: number;

    it('creates an income transaction (amount > 0)', async () => {
      const item = await assetsService.createTransaction({
        date: '2026-09-01T10:00:00.000Z',
        amount: 250000,
        detail: '給与振込',
      });
      expect(item.id).toBeDefined();
      expect(item.amount).toBe(250000);
      expect(item.detail).toBe('給与振込');
      incomeId = item.id;
    });

    it('creates an expense transaction (amount < 0)', async () => {
      const item = await assetsService.createTransaction({
        date: '2026-09-05T15:30:00.000Z',
        amount: -80000,
        detail: '家賃引き落とし',
      });
      expect(item.id).toBeDefined();
      expect(item.amount).toBe(-80000);
      expect(item.detail).toBe('家賃引き落とし');
      expenseId = item.id;
    });

    it('creates a zero-amount transaction (amount = 0)', async () => {
      const item = await assetsService.createTransaction({
        date: '2026-09-10T12:00:00.000Z',
        amount: 0,
        detail: 'ポイント交換（現金移動なし）',
      });
      expect(item.id).toBeDefined();
      expect(item.amount).toBe(0);
      expect(item.detail).toBe('ポイント交換（現金移動なし）');
      zeroId = item.id;
    });

    it('updates a transaction', async () => {
      const updated = await assetsService.updateTransaction(expenseId, {
        amount: -85000,
        detail: '家賃・共益費引き落とし',
      });
      expect(updated.amount).toBe(-85000);
      expect(updated.detail).toBe('家賃・共益費引き落とし');
    });

    it('gets transactions with pagination and no filters', async () => {
      const result = await assetsService.getTransactions({ page: 1, limit: 10 });
      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
      // 日付降順に並んでいること
      expect(new Date(result.items[0]!.date).getTime()).toBeGreaterThanOrEqual(
        new Date(result.items[1]!.date).getTime()
      );
    });

    it('gets transactions filtered by type=income', async () => {
      const result = await assetsService.getTransactions({ type: 'income' });
      expect(result.total).toBe(1);
      expect(result.items[0]?.id).toBe(incomeId);
      expect(result.items[0]?.amount).toBe(250000);
    });

    it('gets transactions filtered by type=expense', async () => {
      const result = await assetsService.getTransactions({ type: 'expense' });
      expect(result.total).toBe(1);
      expect(result.items[0]?.id).toBe(expenseId);
      expect(result.items[0]?.amount).toBe(-85000);
    });

    it('gets transactions filtered by date range', async () => {
      // 2026-09-01 から 2026-09-06 の期間 -> 給与(9/1)と家賃(9/5)のみ
      const result = await assetsService.getTransactions({
        start: '2026-09-01',
        end: '2026-09-06',
      });
      expect(result.total).toBe(2);
      const ids = result.items.map((i) => i.id);
      expect(ids).toContain(incomeId);
      expect(ids).toContain(expenseId);
      expect(ids).not.toContain(zeroId);
    });

    it('calculates stats correctly (incomeTotal, expenseTotal, netProfit)', async () => {
      // 2026年9月の集計
      // 収入: 250000, 支出: -85000, 総損益: 250000 + (-85000) = 165000
      const stats = await assetsService.getStats('2026-09-01', '2026-09-30');
      expect(stats.incomeTotal).toBe(250000);
      expect(stats.expenseTotal).toBe(-85000);
      expect(stats.netProfit).toBe(165000);
    });

    it('deletes a transaction', async () => {
      const result = await assetsService.deleteTransaction(zeroId);
      expect(result.success).toBe(true);

      const found = await assetsService.getTransactionById(zeroId);
      expect(found).toBeNull();
    });
  });

  describe('API Routes: /api/assets', () => {
    let routeTransactionId: number;

    it('POST /transactions creates a transaction', async () => {
      const res = await request(app)
        .post('/api/assets/transactions')
        .send({
          date: '2026-10-01T09:00:00.000Z',
          amount: 50000,
          detail: '副業収入',
        });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.amount).toBe(50000);
      expect(res.body.detail).toBe('副業収入');
      routeTransactionId = res.body.id;
    });

    it('GET /transactions returns paginated list', async () => {
      const res = await request(app).get('/api/assets/transactions?page=1&limit=20');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.items)).toBe(true);
      const found = res.body.items.find((i: any) => i.id === routeTransactionId);
      expect(found).toBeDefined();
    });

    it('GET /transactions?type=income returns only income', async () => {
      const res = await request(app).get('/api/assets/transactions?type=income');
      expect(res.status).toBe(200);
      expect(res.body.items.every((i: any) => i.amount > 0)).toBe(true);
    });

    it('PUT /transactions/:id updates a transaction', async () => {
      const res = await request(app)
        .put(`/api/assets/transactions/${routeTransactionId}`)
        .send({
          amount: 55000,
          detail: '副業収入（修正）',
        });
      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(55000);
      expect(res.body.detail).toBe('副業収入（修正）');
    });

    it('GET /stats returns correct income, expense, and net profit', async () => {
      const res = await request(app).get('/api/assets/stats?start=2026-10-01&end=2026-10-31');
      expect(res.status).toBe(200);
      expect(res.body.incomeTotal).toBe(55000);
      expect(res.body.expenseTotal).toBe(0);
      expect(res.body.netProfit).toBe(55000);
    });

    it('DELETE /transactions/:id deletes a transaction', async () => {
      const res = await request(app).delete(`/api/assets/transactions/${routeTransactionId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
