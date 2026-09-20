import path from 'path';
import { PrismaClient } from '@prisma/client';

const testDbPath = path.resolve(__dirname, '../prisma/test.db');
process.env.DATABASE_URL = `file:${testDbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`,
    },
  },
});

import { tasksService } from '../src/services/tasks';

describe('Tasks Service', () => {
  beforeAll(async () => {
    // 既存データをクリーンアップ
    await prisma.task.deleteMany();
    await prisma.recurringTask.deleteMany();
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.recurringTask.deleteMany();
    await prisma.$disconnect();
  });

  describe('Task CRUD and Total Weight Calculation', () => {
    let parentId: number;
    let childId: number;
    let grandchildId: number;

    it('creates a task with default and specified fields', async () => {
      const task = await tasksService.createTask({
        title: 'Parent Task',
        detail: 'Parent Detail',
        weight: 2,
        deadline: '2026-10-01T23:45:00.000Z',
        status: 'not_started',
      });
      parentId = task.id;

      expect(task.title).toBe('Parent Task');
      expect(task.detail).toBe('Parent Detail');
      expect(task.weight).toBe(2);
      expect(task.totalWeight).toBe(2);
      expect(task.completedAt).toBeNull();
    });

    it('creates a task directly with completed status', async () => {
      const completedTask = await tasksService.createTask({
        title: 'Already Completed',
        weight: 3,
        status: 'completed',
      });

      expect(completedTask.status).toBe('completed');
      expect(completedTask.completedAt).not.toBeNull();

      // クリーンアップ
      await tasksService.deleteTask(completedTask.id);
    });

    it('creates child and grandchild tasks and calculates nested totalWeight', async () => {
      const child = await tasksService.createTask({
        title: 'Child Task',
        weight: 3,
        parentTaskId: parentId,
      });
      childId = child.id;

      const grandchild = await tasksService.createTask({
        title: 'Grandchild Task',
        weight: 1,
        parentTaskId: childId,
      });
      grandchildId = grandchild.id;

      // 親タスク一覧（parentTaskId=null）を取得
      const rootTasks = await tasksService.getTasks({});
      expect(rootTasks.items.length).toBe(1);
      // 親の totalWeight: 2 (親) + 3 (子) + 1 (孫) = 6
      expect(rootTasks.items[0]?.id).toBe(parentId);
      expect(rootTasks.items[0]?.totalWeight).toBe(6);

      // 子タスク一覧を取得 (モード2: parentTaskId 指定)
      const childTasks = (await tasksService.getTasks({
        parentTaskId: parentId,
      })) as any[];
      expect(childTasks.length).toBe(1);
      expect(childTasks[0]?.id).toBe(childId);
      // 子の totalWeight: 3 (子) + 1 (孫) = 4
      expect(childTasks[0]?.totalWeight).toBe(4);
    });

    it('searches tasks across all nesting levels', async () => {
      // 'Grandchild' で検索
      const searchResult = await tasksService.getTasks({ search: 'Grandchild' });
      expect(searchResult.items.length).toBe(1);
      expect(searchResult.items[0]?.id).toBe(grandchildId);
    });

    it('sorts tasks and paginates', async () => {
      // もう1つルートタスクを作成
      const task2 = await tasksService.createTask({
        title: 'Alpha Task',
        weight: 5,
        deadline: '2026-09-01T12:00:00.000Z',
      });

      const sortedByWeight = await tasksService.getTasks({
        sort: 'weight',
        order: 'asc',
        limit: 10,
        page: 1,
      });
      // weight 2 (Parent) < weight 5 (Alpha Task)
      expect(sortedByWeight.items[0]?.weight).toBeLessThanOrEqual(sortedByWeight.items[1]?.weight ?? 999);

      // クリーンアップ
      await tasksService.deleteTask(task2.id);
    });

    it('updates task status and toggles completedAt', async () => {
      // not_started -> completed
      const updatedToCompleted = await tasksService.updateTask(parentId, {
        status: 'completed',
      });
      expect(updatedToCompleted.status).toBe('completed');
      expect(updatedToCompleted.completedAt).not.toBeNull();

      // completed -> not_started
      const updatedBack = await tasksService.updateTask(parentId, {
        status: 'not_started',
      });
      expect(updatedBack.status).toBe('not_started');
      expect(updatedBack.completedAt).toBeNull();
    });

    it('gets completed stats for a given period', async () => {
      // 一時的に子タスクと孫タスクを完了にして集計確認
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      await tasksService.updateTask(childId, { status: 'completed' });
      await tasksService.updateTask(grandchildId, { status: 'completed' });

      const stats = await tasksService.getCompletedStats(todayStr, todayStr);
      // childId (weight 3) + grandchildId (weight 1) = count 2, totalWeight 4
      expect(stats.count).toBe(2);
      expect(stats.totalWeight).toBe(4);
    });

    it('cascades delete from parent to all child tasks', async () => {
      await tasksService.deleteTask(parentId);

      const remainingTasks = await prisma.task.findMany();
      expect(remainingTasks.length).toBe(0);
    });
  });

  describe('Recurring Tasks', () => {
    let recurringId: number;

    it('creates, reads, updates, and deletes a recurring task', async () => {
      // 作成
      const created = await tasksService.createRecurringTask({
        title: 'Morning Routine',
        detail: 'Check emails',
        weight: 1,
        repeatType: 'daily',
        repeatTime: '09:00',
        deadlineOffset: 120, // 2時間後
      });
      recurringId = created.id;
      expect(created.title).toBe('Morning Routine');
      expect(created.repeatTime).toBe('09:00');

      // 一覧
      const all = await tasksService.getRecurringTasks();
      expect(all.length).toBe(1);
      expect(all[0]?.id).toBe(recurringId);

      // 更新
      const updated = await tasksService.updateRecurringTask(recurringId, {
        repeatTime: '08:30',
      });
      expect(updated.repeatTime).toBe('08:30');

      // 手動トリガー
      const baseDate = new Date('2026-10-10T08:30:00.000Z');
      const triggeredTask = await tasksService.triggerRecurringTask(recurringId, baseDate);
      expect(triggeredTask.title).toBe('Morning Routine');
      expect(triggeredTask.weight).toBe(1);
      expect(triggeredTask.deadline).toEqual(
        new Date(baseDate.getTime() + 120 * 60 * 1000)
      );

      // トリガーで生成されたタスクを削除
      await tasksService.deleteTask(triggeredTask.id);

      // 削除
      await tasksService.deleteRecurringTask(recurringId);
      const remaining = await tasksService.getRecurringTasks();
      expect(remaining.length).toBe(0);
    });

    it('automatically checks and creates recurring tasks matching schedule', async () => {
      // 2026-10-14 (水曜日) 10:00
      // 曜日: 0:日, 1:月, 2:火, 3:水
      const mockDate = new Date(2026, 9, 14, 10, 0, 0); // 10月はindex 9

      const dailyTask = await tasksService.createRecurringTask({
        title: 'Daily Task',
        weight: 1,
        repeatType: 'daily',
        repeatTime: '10:00',
      });

      const weeklyTask = await tasksService.createRecurringTask({
        title: 'Weekly Task (Wed)',
        weight: 2,
        repeatType: 'weekly',
        repeatTime: '10:00',
        repeatDays: '1,3,5', // 月,水,金
      });

      const notMatchingWeekly = await tasksService.createRecurringTask({
        title: 'Weekly Task (Sun)',
        weight: 2,
        repeatType: 'weekly',
        repeatTime: '10:00',
        repeatDays: '0', // 日
      });

      const monthlyTask = await tasksService.createRecurringTask({
        title: 'Monthly Task',
        weight: 3,
        repeatType: 'monthly',
        repeatTime: '10:00',
        repeatDays: '14', // 14日
      });

      const manualTask = await tasksService.createRecurringTask({
        title: 'Manual Task',
        weight: 1,
        repeatType: 'manual',
      });

      const createdTasks = await tasksService.checkAndCreateRecurringTasks(mockDate);

      // dailyTask, weeklyTask, monthlyTask の3件が生成されるはず
      expect(createdTasks.length).toBe(3);
      const titles = createdTasks.map(t => t.title);
      expect(titles).toContain('Daily Task');
      expect(titles).toContain('Weekly Task (Wed)');
      expect(titles).toContain('Monthly Task');
      expect(titles).not.toContain('Weekly Task (Sun)');
      expect(titles).not.toContain('Manual Task');

      // クリーンアップ
      for (const t of createdTasks) {
        await tasksService.deleteTask(t.id);
      }
      await tasksService.deleteRecurringTask(dailyTask.id);
      await tasksService.deleteRecurringTask(weeklyTask.id);
      await tasksService.deleteRecurringTask(notMatchingWeekly.id);
      await tasksService.deleteRecurringTask(monthlyTask.id);
      await tasksService.deleteRecurringTask(manualTask.id);
    });
  });

  describe('Tasks API Routes', () => {
    const express = require('express');
    const request = require('supertest');
    const tasksRouter = require('../src/routes/tasks').default;

    const app = express();
    app.use(express.json());
    app.use('/api/tasks', tasksRouter);

    let createdTaskId: number;
    let createdRecurringId: number;

    it('POST /api/tasks creates a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'API Test Task',
          weight: 2,
          detail: 'Created via API',
        });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('API Test Task');
      expect(res.body.totalWeight).toBe(2);
      createdTaskId = res.body.id;
    });

    it('GET /api/tasks retrieves task list', async () => {
      const res = await request(app).get('/api/tasks?search=API Test');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.total).toBe(1);
    });

    it('PUT /api/tasks/:id updates a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('GET /api/tasks/completed-stats returns completed counts and weight', async () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const res = await request(app).get(`/api/tasks/completed-stats?start=${todayStr}&end=${todayStr}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.totalWeight).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/tasks/recurring creates a recurring task', async () => {
      const res = await request(app)
        .post('/api/tasks/recurring')
        .send({
          title: 'Recurring via API',
          repeatType: 'daily',
          repeatTime: '12:00',
        });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Recurring via API');
      createdRecurringId = res.body.id;
    });

    it('POST /api/tasks/recurring/:id/trigger triggers a recurring task', async () => {
      const res = await request(app).post(`/api/tasks/recurring/${createdRecurringId}/trigger`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Recurring via API');

      // クリーンアップ
      await request(app).delete(`/api/tasks/${res.body.id}`);
    });

    it('DELETE /api/tasks/recurring/:id deletes a recurring task', async () => {
      const res = await request(app).delete(`/api/tasks/recurring/${createdRecurringId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/tasks/:id deletes a task', async () => {
      const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

