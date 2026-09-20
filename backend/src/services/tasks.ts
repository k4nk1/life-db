import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateRecurringTaskRequest,
  UpdateRecurringTaskRequest,
} from '../../../shared/types/tasks';

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

// 全タスクのツリー構造から totalWeight（自身 + 全子孫の重さ合計）を計算して付与する
async function attachTotalWeights<T extends { id: number; weight: number }>(
  tasks: T[]
): Promise<(T & { totalWeight: number })[]> {
  if (tasks.length === 0) return [];

  const allTasks = await prisma.task.findMany({
    select: { id: true, parentTaskId: true, weight: true },
  });

  const childrenMap = new Map<number, { id: number; weight: number }[]>();
  for (const t of allTasks) {
    if (t.parentTaskId !== null) {
      const list = childrenMap.get(t.parentTaskId) || [];
      list.push({ id: t.id, weight: t.weight });
      childrenMap.set(t.parentTaskId, list);
    }
  }

  const memo = new Map<number, number>();
  const visited = new Set<number>();

  function getTotalWeight(id: number, weight: number): number {
    if (memo.has(id)) return memo.get(id)!;
    if (visited.has(id)) return weight; // 循環参照防止
    visited.add(id);

    let total = weight;
    const children = childrenMap.get(id) || [];
    for (const child of children) {
      total += getTotalWeight(child.id, child.weight);
    }

    visited.delete(id);
    memo.set(id, total);
    return total;
  }

  return tasks.map(task => ({
    ...task,
    totalWeight: getTotalWeight(task.id, task.weight),
  }));
}

export const tasksService = {
  // タスク一覧・検索・子タスク取得
  async getTasks(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    status?: string;
    deadlineBefore?: string;
    parentTaskId?: number;
  }) {
    // モード2: 子タスク取得（parentTaskId 指定時、ページネーションなし）
    if (params.parentTaskId !== undefined) {
      const tasks = await prisma.task.findMany({
        where: { parentTaskId: params.parentTaskId },
        orderBy: { id: 'asc' },
      });
      return attachTotalWeights(tasks);
    }

    // モード1: ルート/検索（ページネーションあり）
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 50);

    const where: any = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { detail: { contains: params.search } },
      ];
    } else {
      where.parentTaskId = null;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.deadlineBefore) {
      where.deadline = { lte: new Date(params.deadlineBefore) };
    }

    const sortOrder = params.order === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { id: 'desc' };
    if (params.sort === 'weight') {
      orderBy = { weight: sortOrder };
    } else if (params.sort === 'deadline') {
      orderBy = { deadline: sortOrder };
    } else if (params.sort === 'status') {
      orderBy = { status: sortOrder };
    }

    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = await attachTotalWeights(tasks);
    return { items, total };
  },

  // タスク作成
  async createTask(data: CreateTaskRequest) {
    const isCompleted = data.status === 'completed';
    const completedAt = isCompleted ? new Date() : null;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        detail: data.detail ?? null,
        weight: data.weight ?? 1,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status ?? 'not_started',
        completedAt,
        parentTaskId: data.parentTaskId ?? null,
      },
    });

    const [taskWithWeight] = await attachTotalWeights([task]);
    return taskWithWeight ?? task;
  },

  // タスク更新
  async updateTask(id: number, data: UpdateTaskRequest) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`);
    }

    let completedAt = existing.completedAt;
    if (data.status !== undefined) {
      if (data.status === 'completed' && existing.status !== 'completed') {
        completedAt = new Date();
      } else if (data.status !== 'completed' && existing.status === 'completed') {
        completedAt = null;
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.detail !== undefined) updateData.detail = data.detail;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      updateData.completedAt = completedAt;
    }
    if (data.parentTaskId !== undefined) updateData.parentTaskId = data.parentTaskId;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    const [updatedWithWeight] = await attachTotalWeights([updated]);
    return updatedWithWeight ?? updated;
  },

  // タスク削除 (Cascade で子タスクも削除される)
  async deleteTask(id: number) {
    return prisma.task.delete({
      where: { id },
    });
  },

  // 完了履歴統計
  async getCompletedStats(start: string, end: string) {
    const startDate = new Date(`${start}T00:00:00.000`);
    const endDate = new Date(`${end}T23:59:59.999`);

    const result = await prisma.task.aggregate({
      where: {
        status: 'completed',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      _sum: { weight: true },
    });

    return {
      count: result._count.id,
      totalWeight: result._sum.weight ?? 0,
    };
  },

  // 繰り返しタスク一覧
  async getRecurringTasks() {
    return prisma.recurringTask.findMany({
      orderBy: { id: 'asc' },
    });
  },

  // 繰り返しタスク作成
  async createRecurringTask(data: CreateRecurringTaskRequest) {
    return prisma.recurringTask.create({
      data: {
        title: data.title,
        detail: data.detail ?? null,
        weight: data.weight ?? 1,
        repeatType: data.repeatType,
        repeatTime: data.repeatTime ?? null,
        repeatDays: data.repeatDays ?? null,
        deadlineOffset: data.deadlineOffset ?? null,
      },
    });
  },

  // 繰り返しタスク更新
  async updateRecurringTask(id: number, data: UpdateRecurringTaskRequest) {
    return prisma.recurringTask.update({
      where: { id },
      data,
    });
  },

  // 繰り返しタスク削除
  async deleteRecurringTask(id: number) {
    return prisma.recurringTask.delete({
      where: { id },
    });
  },

  // 繰り返しタスク手動トリガー (タスク一覧に追加)
  async triggerRecurringTask(id: number, baseDate: Date = new Date()) {
    const recurring = await prisma.recurringTask.findUnique({ where: { id } });
    if (!recurring) {
      throw new Error(`RecurringTask with ID ${id} not found`);
    }

    let deadline: Date | null = null;
    if (recurring.deadlineOffset !== null && recurring.deadlineOffset !== undefined) {
      deadline = new Date(baseDate.getTime() + recurring.deadlineOffset * 60 * 1000);
    }

    return this.createTask({
      title: recurring.title,
      detail: recurring.detail,
      weight: recurring.weight,
      deadline: deadline ? deadline.toISOString() : null,
      status: 'not_started',
      parentTaskId: null,
    });
  },

  // 定期実行チェック (daily / weekly / monthly の繰り返しタスクを自動生成)
  async checkAndCreateRecurringTasks(currentDate: Date = new Date()) {
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    const currentDayOfWeek = String(currentDate.getDay()); // 0:日, 1:月, ... 6:土
    const currentDateOfMonth = String(currentDate.getDate()); // 1〜31

    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        repeatType: { in: ['daily', 'weekly', 'monthly'] },
      },
    });

    const createdTasks = [];

    for (const item of recurringTasks) {
      if (!item.repeatTime || item.repeatTime !== currentTimeStr) {
        continue;
      }

      let isMatch = false;
      if (item.repeatType === 'daily') {
        isMatch = true;
      } else if (item.repeatType === 'weekly' && item.repeatDays) {
        const days = item.repeatDays.split(',').map(d => d.trim());
        if (days.includes(currentDayOfWeek)) {
          isMatch = true;
        }
      } else if (item.repeatType === 'monthly' && item.repeatDays) {
        const days = item.repeatDays.split(',').map(d => d.trim());
        if (days.includes(currentDateOfMonth)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        const newTask = await this.triggerRecurringTask(item.id, currentDate);
        createdTasks.push(newTask);
      }
    }

    return createdTasks;
  },
};
