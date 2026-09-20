import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

export const dailyService = {
  // Records
  async getRecord(date: string) {
    const record = await prisma.dailyRecord.findUnique({
      where: { date },
      include: { actions: true },
    });
    if (!record) {
      return { id: 0, date, goal: null, reflection: null, actions: [] };
    }
    return record;
  },

  async updateRecord(date: string, data: { goal?: string; reflection?: string }) {
    return prisma.dailyRecord.upsert({
      where: { date },
      update: data,
      create: { date, ...data },
    });
  },

  // Actions
  async createAction(date: string, data: { subtypeId: number; startMinutes: number; endMinutes: number; detail?: string }) {
    const record = await prisma.dailyRecord.upsert({
      where: { date },
      update: {},
      create: { date },
    });

    return prisma.action.create({
      data: {
        dailyRecordId: record.id,
        ...data,
      },
    });
  },

  async updateAction(id: number, data: { subtypeId?: number; startMinutes?: number; endMinutes?: number; detail?: string }) {
    return prisma.action.update({
      where: { id },
      data,
    });
  },

  async deleteAction(id: number) {
    return prisma.action.delete({
      where: { id },
    });
  },

  // Stats
  async getStats(start: string, end: string, groupBy: 'type' | 'subtype') {
    const actions = await prisma.action.findMany({
      where: {
        dailyRecord: {
          date: { gte: start, lte: end },
        },
      },
      include: {
        subtype: {
          include: {
            type: true,
          },
        },
      },
    });

    const parseToDays = (dStr: string) => {
      const parts = dStr.split('-').map(Number);
      return Math.floor(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!) / (1000 * 60 * 60 * 24));
    };

    const startDay = parseToDays(start);
    const endDay = parseToDays(end);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDay = parseToDays(todayStr);

    // 期間内で経過した日数（今日が水曜日で今週なら3で割る）
    const effectiveEndDay = Math.min(endDay, todayDay);
    const days = Math.max(1, effectiveEndDay - startDay + 1);

    const statsMap = new Map<
      number,
      { id: number; name: string; typeName?: string | undefined; color: string; totalMinutes: number }
    >();

    for (const action of actions) {
      const minutes = action.endMinutes - action.startMinutes;
      const keyId = groupBy === 'type' ? action.subtype.type.id : action.subtype.id;

      if (!statsMap.has(keyId)) {
        statsMap.set(keyId, {
          id: keyId,
          name: groupBy === 'type' ? action.subtype.type.name : action.subtype.name,
          typeName: groupBy === 'subtype' ? action.subtype.type.name : undefined,
          color: action.subtype.type.color,
          totalMinutes: 0,
        });
      }
      statsMap.get(keyId)!.totalMinutes += minutes;
    }

    const totalMinutesAll = Array.from(statsMap.values()).reduce((sum, s) => sum + s.totalMinutes, 0);

    return Array.from(statsMap.values()).map(s => ({
      ...s,
      percentage: totalMinutesAll > 0 ? (s.totalMinutes / totalMinutesAll) * 100 : 0,
      dailyAverageMinutes: s.totalMinutes / days,
    }));
  },

  // Types
  async getTypes() {
    return prisma.actionType.findMany({
      include: {
        subtypes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async createType(data: { name: string; color: string; sortOrder: number }) {
    return prisma.actionType.create({ data });
  },

  async updateType(id: number, data: { name?: string; color?: string; sortOrder?: number }) {
    if (data.sortOrder !== undefined) {
      const currentType = await prisma.actionType.findUnique({ where: { id } });
      if (currentType && currentType.sortOrder !== data.sortOrder) {
        if (data.sortOrder > currentType.sortOrder) {
          await prisma.actionType.updateMany({
            where: { sortOrder: { gt: currentType.sortOrder, lte: data.sortOrder } },
            data: { sortOrder: { decrement: 1 } },
          });
        } else {
          await prisma.actionType.updateMany({
            where: { sortOrder: { gte: data.sortOrder, lt: currentType.sortOrder } },
            data: { sortOrder: { increment: 1 } },
          });
        }
      }
    }
    return prisma.actionType.update({ where: { id }, data });
  },

  async deleteType(id: number) {
    return prisma.actionType.delete({ where: { id } });
  },

  // Subtypes
  async createSubtype(data: { name: string; typeId: number; sortOrder: number }) {
    return prisma.actionSubtype.create({ data });
  },

  async updateSubtype(id: number, data: { name?: string; sortOrder?: number }) {
    return prisma.actionSubtype.update({ where: { id }, data });
  },

  async deleteSubtype(id: number) {
    return prisma.actionSubtype.delete({ where: { id } });
  },
};
