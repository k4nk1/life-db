import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const startIdx = new Date(start).getTime() / (1000 * 60 * 60 * 24);
    const endIdx = new Date(end).getTime() / (1000 * 60 * 60 * 24);
    const days = Math.max(1, endIdx - startIdx + 1);

    const statsMap = new Map<number, { id: number; name: string; color: string; totalMinutes: number }>();

    for (const action of actions) {
      const minutes = action.endMinutes - action.startMinutes;
      const keyId = groupBy === 'type' ? action.subtype.type.id : action.subtype.id;
      
      if (!statsMap.has(keyId)) {
        statsMap.set(keyId, {
          id: keyId,
          name: groupBy === 'type' ? action.subtype.type.name : action.subtype.name,
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
