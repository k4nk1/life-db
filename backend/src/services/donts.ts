import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  DontEntryItem,
  CreateDontEntryRequest,
  UpdateDontEntryRequest,
} from '../../../shared/types/donts';

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

function getMondayStart(date: Date): number {
  const d = new Date(date);
  const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const dontsService = {
  // エントリー一覧取得（週フィルタ、指定週の振り返り付き）
  async getEntries(weekStart?: string): Promise<DontEntryItem[]> {
    let where: any = {};
    if (weekStart) {
      const parts = weekStart.split('-').map(Number);
      const year = parts[0] ?? 1970;
      const month = parts[1] ?? 1;
      const day = parts[2] ?? 1;
      // 選択週の日曜日の終わり (23:59:59.999 UTC)
      // 月曜日の日付から6日後が日曜日
      const endOfWeek = new Date(Date.UTC(year, month - 1, day + 6, 23, 59, 59, 999));
      where = {
        OR: [
          { deletedAt: null },
          { deletedAt: { gt: endOfWeek } },
        ],
      };
    } else {
      where = {
        deletedAt: null,
      };
    }

    const entries = await prisma.dontEntry.findMany({
      where,
      include: {
        reviews: weekStart
          ? {
              where: { weekStart },
            }
          : false,
      },
      orderBy: { id: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      createdAt: entry.createdAt,
      deletedAt: entry.deletedAt,
      review: entry.reviews && entry.reviews.length > 0 ? entry.reviews[0]?.review ?? null : null,
    }));
  },

  // エントリー作成
  async createEntry(data: CreateDontEntryRequest) {
    return prisma.dontEntry.create({
      data: {
        content: data.content,
      },
    });
  },

  // エントリー更新
  async updateEntry(id: number, data: UpdateDontEntryRequest) {
    return prisma.dontEntry.update({
      where: { id },
      data: {
        content: data.content,
      },
    });
  },

  // エントリー削除（週をまたいでいない場合は物理削除、週をまたいでいる場合は論理削除）
  async deleteEntry(id: number, now: Date = new Date()) {
    const entry = await prisma.dontEntry.findUnique({
      where: { id },
    });
    if (!entry) {
      return null;
    }

    const createdMonday = getMondayStart(entry.createdAt);
    const currentMonday = getMondayStart(now);

    // 月曜日の0:00が間にない（同一週内）場合は物理削除
    if (createdMonday === currentMonday) {
      return prisma.dontEntry.delete({
        where: { id },
      });
    }

    // 週をまたいでいる場合は論理削除
    return prisma.dontEntry.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  },

  // 振り返りの作成・更新（upsert）
  async upsertReview(entryId: number, weekStart: string, review: string) {
    return prisma.dontReview.upsert({
      where: {
        entryId_weekStart: {
          entryId,
          weekStart,
        },
      },
      update: {
        review,
      },
      create: {
        entryId,
        weekStart,
        review,
      },
    });
  },
};
