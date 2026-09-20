import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  Tag,
  FactSupplement,
  FactEntryItem,
  GetFactsParams,
  GetFactsResponse,
  CreateFactEntryRequest,
  UpdateFactEntryRequest,
  RandomFactResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from '../../../shared/types/facts';

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

function formatEntry(entry: any): FactEntryItem {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    createdAt: entry.createdAt,
    tags: entry.tags
      ? entry.tags.map((t: any) => ({
          id: t.tag.id,
          name: t.tag.name,
          color: t.tag.color,
          sortOrder: t.tag.sortOrder,
        }))
      : [],
    supplements: entry.supplements
      ? entry.supplements.map((s: any) => ({
          id: s.id,
          content: s.content,
          createdAt: s.createdAt,
        }))
      : [],
  };
}

export const factsService = {
  // Tags
  async getTags(): Promise<Tag[]> {
    return prisma.tag.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  },

  async createTag(data: CreateTagRequest): Promise<Tag> {
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const lastTag = await prisma.tag.findFirst({
        orderBy: { sortOrder: 'desc' },
      });
      sortOrder = lastTag ? lastTag.sortOrder + 1 : 0;
    }
    return prisma.tag.create({
      data: {
        name: data.name,
        color: data.color,
        sortOrder,
      },
    });
  },

  async updateTag(id: number, data: UpdateTagRequest): Promise<Tag> {
    if (data.sortOrder !== undefined) {
      const currentTag = await prisma.tag.findUnique({ where: { id } });
      if (currentTag && currentTag.sortOrder !== data.sortOrder) {
        if (data.sortOrder > currentTag.sortOrder) {
          await prisma.tag.updateMany({
            where: { sortOrder: { gt: currentTag.sortOrder, lte: data.sortOrder } },
            data: { sortOrder: { decrement: 1 } },
          });
        } else {
          await prisma.tag.updateMany({
            where: { sortOrder: { gte: data.sortOrder, lt: currentTag.sortOrder } },
            data: { sortOrder: { increment: 1 } },
          });
        }
      }
    }
    return prisma.tag.update({
      where: { id },
      data,
    });
  },

  async deleteTag(id: number): Promise<Tag> {
    return prisma.tag.delete({
      where: { id },
    });
  },

  // Facts
  async getFacts(params: GetFactsParams = {}): Promise<GetFactsResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 50);

    const where: any = {};

    if (params.search) {
      where.OR = [
        { title: { contains: params.search } },
        { content: { contains: params.search } },
      ];
    }

    if (params.tags) {
      let tagIds: number[] = [];
      if (typeof params.tags === 'string') {
        tagIds = params.tags
          .split(',')
          .map(s => Number(s.trim()))
          .filter(n => !isNaN(n));
      } else if (Array.isArray(params.tags)) {
        tagIds = params.tags.map(Number).filter(n => !isNaN(n));
      }

      if (tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: { in: tagIds },
          },
        };
      }
    }

    const total = await prisma.factEntry.count({ where });
    const entries = await prisma.factEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { sortOrder: 'asc' } },
        },
        supplements: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      items: entries.map(formatEntry),
      total,
    };
  },

  async createFact(data: CreateFactEntryRequest): Promise<FactEntryItem> {
    const entry = await prisma.factEntry.create({
      data: {
        title: data.title,
        content: data.content ?? null,
        tags:
          data.tagIds && data.tagIds.length > 0
            ? {
                create: data.tagIds.map(tagId => ({ tagId })),
              }
            : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { sortOrder: 'asc' } },
        },
        supplements: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return formatEntry(entry);
  },

  async updateFact(id: number, data: UpdateFactEntryRequest): Promise<FactEntryItem> {
    if (data.tagIds !== undefined) {
      await prisma.$transaction([
        prisma.factEntryTag.deleteMany({
          where: { entryId: id },
        }),
        prisma.factEntryTag.createMany({
          data: data.tagIds.map(tagId => ({ entryId: id, tagId })),
        }),
      ]);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    const entry = await prisma.factEntry.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { sortOrder: 'asc' } },
        },
        supplements: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return formatEntry(entry);
  },

  async deleteFact(id: number): Promise<{ success: boolean }> {
    await prisma.factEntry.delete({
      where: { id },
    });
    return { success: true };
  },

  async getRandomFact(): Promise<RandomFactResponse | null> {
    const count = await prisma.factEntry.count();
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    const entry = await prisma.factEntry.findFirst({
      skip,
      include: {
        tags: {
          include: { tag: true },
          orderBy: { tag: { sortOrder: 'asc' } },
        },
      },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      createdAt: entry.createdAt,
      tags: entry.tags.map(t => ({
        id: t.tag.id,
        name: t.tag.name,
        color: t.tag.color,
      })),
    };
  },

  // Supplements
  async createSupplement(entryId: number, content: string): Promise<FactSupplement> {
    return prisma.factSupplement.create({
      data: {
        entryId,
        content,
      },
    });
  },

  async deleteSupplement(id: number): Promise<{ success: boolean }> {
    await prisma.factSupplement.delete({
      where: { id },
    });
    return { success: true };
  },
};
