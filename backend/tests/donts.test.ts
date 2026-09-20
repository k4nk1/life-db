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

import { dontsService } from '../src/services/donts';
import dontsRouter from '../src/routes/donts';

describe('Donts Service & Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/donts', dontsRouter);

  beforeAll(async () => {
    await prisma.dontReview.deleteMany();
    await prisma.dontEntry.deleteMany();
  });

  afterAll(async () => {
    await prisma.dontReview.deleteMany();
    await prisma.dontEntry.deleteMany();
    await prisma.$disconnect();
  });

  describe('Service: CRUD & Review logic', () => {
    let entryId: number;
    const weekStart = '2026-09-14';

    it('creates a dont entry', async () => {
      const entry = await dontsService.createEntry({ content: '夜遅くにスマホを見ない' });
      expect(entry.id).toBeDefined();
      expect(entry.content).toBe('夜遅くにスマホを見ない');
      expect(entry.deletedAt).toBeNull();
      entryId = entry.id;
    });

    it('updates a dont entry', async () => {
      const updated = await dontsService.updateEntry(entryId, { content: '23時以降にスマホを見ない' });
      expect(updated.content).toBe('23時以降にスマホを見ない');
    });

    it('upserts a review for a week (create)', async () => {
      const review = await dontsService.upsertReview(entryId, weekStart, '3日達成できた');
      expect(review.entryId).toBe(entryId);
      expect(review.weekStart).toBe(weekStart);
      expect(review.review).toBe('3日達成できた');
    });

    it('upserts a review for a week (update)', async () => {
      const review = await dontsService.upsertReview(entryId, weekStart, '4日達成できた（修正）');
      expect(review.review).toBe('4日達成できた（修正）');
    });

    it('gets entries with review for the specified week', async () => {
      const entries = await dontsService.getEntries(weekStart);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.id).toBe(entryId);
      expect(entries[0]?.review).toBe('4日達成できた（修正）');
    });

    it('gets entries with null review for another week', async () => {
      const entries = await dontsService.getEntries('2026-09-07');
      expect(entries).toHaveLength(1);
      expect(entries[0]?.id).toBe(entryId);
      expect(entries[0]?.review).toBeNull();
    });

    it('performs hard delete when deleted within the same week', async () => {
      // 作成日時と同じ週内での削除
      const entry = await prisma.dontEntry.findUnique({ where: { id: entryId } });
      const sameWeekDate = new Date(entry!.createdAt);
      // 同じ週の日時で削除
      const deleted = await dontsService.deleteEntry(entryId, sameWeekDate);
      expect(deleted).not.toBeNull();
      // DBから物理削除されていること
      const inDb = await prisma.dontEntry.findUnique({ where: { id: entryId } });
      expect(inDb).toBeNull();
    });

    it('performs logical delete when deleted across weeks (after Monday 0:00)', async () => {
      // 過去の日付でエントリー作成
      const pastEntry = await prisma.dontEntry.create({
        data: {
          content: '先週作成したエントリー',
          createdAt: new Date('2026-09-07T10:00:00.000Z'), // 2026-09-07 の週
        },
      });

      // 翌週以降（2026-09-14 の週）の日時で削除
      const nextWeekDate = new Date('2026-09-14T10:00:00.000Z');
      const deleted = await dontsService.deleteEntry(pastEntry.id, nextWeekDate);
      expect(deleted?.deletedAt).not.toBeNull();

      // DBに論理削除されたレコードが残っていること
      const inDb = await prisma.dontEntry.findUnique({ where: { id: pastEntry.id } });
      expect(inDb).not.toBeNull();
      expect(inDb?.deletedAt).not.toBeNull();
    });
  });

  describe('Service: Logical deletion visibility by week', () => {
    let activeEntryId: number;
    let deletedEntryId: number;

    beforeAll(async () => {
      // 常に有効なエントリー
      const active = await dontsService.createEntry({ content: '暴飲暴食をしない' });
      activeEntryId = active.id;

      // 2026-09-16 に論理削除されたエントリー
      const toDelete = await dontsService.createEntry({ content: '昼寝をしすぎない' });
      deletedEntryId = toDelete.id;
      await prisma.dontEntry.update({
        where: { id: deletedEntryId },
        data: {
          deletedAt: new Date('2026-09-16T15:00:00.000Z'),
        },
      });
    });

    it('shows deleted entry in past weeks (before deletion week)', async () => {
      // 過去週 2026-09-07 (日曜日は 2026-09-13) -> 削除日時 (2026-09-16) より前なので表示される
      const entries = await dontsService.getEntries('2026-09-07');
      const ids = entries.map((e) => e.id);
      expect(ids).toContain(activeEntryId);
      expect(ids).toContain(deletedEntryId);
    });

    it('hides deleted entry in deletion week', async () => {
      // 削除週 2026-09-14 (日曜日は 2026-09-20) -> 削除日時 (2026-09-16) は日曜以前なので非表示
      const entries = await dontsService.getEntries('2026-09-14');
      const ids = entries.map((e) => e.id);
      expect(ids).toContain(activeEntryId);
      expect(ids).not.toContain(deletedEntryId);
    });

    it('hides deleted entry in future weeks', async () => {
      // 未来週 2026-09-21 (日曜日は 2026-09-27) -> 非表示
      const entries = await dontsService.getEntries('2026-09-21');
      const ids = entries.map((e) => e.id);
      expect(ids).toContain(activeEntryId);
      expect(ids).not.toContain(deletedEntryId);
    });

    it('returns only active entries when weekStart is omitted', async () => {
      const entries = await dontsService.getEntries();
      const ids = entries.map((e) => e.id);
      expect(ids).toContain(activeEntryId);
      expect(ids).not.toContain(deletedEntryId);
    });
  });

  describe('API Routes: /api/donts', () => {
    let routeEntryId: number;
    const weekStart = '2026-10-05';

    it('POST /api/donts creates an entry', async () => {
      const res = await request(app)
        .post('/api/donts')
        .send({ content: '無駄な出費をしない' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('無駄な出費をしない');
      expect(res.body.id).toBeDefined();
      routeEntryId = res.body.id;
    });

    it('GET /api/donts returns entries with review', async () => {
      const res = await request(app).get(`/api/donts?weekStart=${weekStart}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((e: any) => e.id === routeEntryId);
      expect(found).toBeDefined();
      expect(found.review).toBeNull();
    });

    it('PUT /api/donts/:id updates an entry', async () => {
      const res = await request(app)
        .put(`/api/donts/${routeEntryId}`)
        .send({ content: '衝動買いをしない' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('衝動買いをしない');
    });

    it('PUT /api/donts/:id/reviews/:weekStart upserts review', async () => {
      const res = await request(app)
        .put(`/api/donts/${routeEntryId}/reviews/${weekStart}`)
        .send({ review: '予算内に収まった' });
      expect(res.status).toBe(200);
      expect(res.body.review).toBe('予算内に収まった');
      expect(res.body.weekStart).toBe(weekStart);

      // Verify via GET
      const getRes = await request(app).get(`/api/donts?weekStart=${weekStart}`);
      const found = getRes.body.find((e: any) => e.id === routeEntryId);
      expect(found.review).toBe('予算内に収まった');
    });

    it('DELETE /api/donts/:id logically deletes an entry', async () => {
      const res = await request(app).delete(`/api/donts/${routeEntryId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that it is not returned when weekStart is omitted
      const getRes = await request(app).get('/api/donts');
      const found = getRes.body.find((e: any) => e.id === routeEntryId);
      expect(found).toBeUndefined();
    });
  });
});
