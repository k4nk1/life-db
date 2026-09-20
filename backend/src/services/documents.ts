import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  DocumentListItem,
  DocumentItem,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentType,
} from '../../../shared/types/documents';

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

export const documentsService = {
  // 指定階層の子要素を取得（本文なし）
  async getDocuments(parentId: number | null = null): Promise<DocumentListItem[]> {
    const docs = await prisma.document.findMany({
      where: {
        parentId: parentId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return docs.map((doc) => ({
      ...doc,
      type: doc.type as DocumentType,
    }));
  },

  // 単一ドキュメントの本文を取得
  async getDocumentById(id: number): Promise<DocumentItem | null> {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return null;
    }

    return {
      ...doc,
      type: doc.type as DocumentType,
    };
  },

  // フォルダ/ドキュメントを作成
  async createDocument(data: CreateDocumentRequest): Promise<DocumentItem> {
    const doc = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        parentId: data.parentId ?? null,
        content: data.type === 'folder' ? null : (data.content ?? null),
      },
    });

    return {
      ...doc,
      type: doc.type as DocumentType,
    };
  },

  // 名前変更・本文編集
  async updateDocument(id: number, data: UpdateDocumentRequest): Promise<DocumentItem> {
    const updateData: { name?: string; content?: string | null } = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    const doc = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return {
      ...doc,
      type: doc.type as DocumentType,
    };
  },

  // 削除（フォルダは再帰的にカスケード削除）
  async deleteDocument(id: number): Promise<{ success: boolean }> {
    await prisma.document.delete({
      where: { id },
    });
    return { success: true };
  },

  // 別のフォルダに移動
  async moveDocument(id: number, parentId: number | null): Promise<DocumentItem> {
    const doc = await prisma.document.update({
      where: { id },
      data: {
        parentId: parentId ?? null,
      },
    });

    return {
      ...doc,
      type: doc.type as DocumentType,
    };
  },

  // 複製（フォルダは配下も再帰的に複製）
  async duplicateDocument(id: number): Promise<DocumentItem> {
    const target = await prisma.document.findUnique({
      where: { id },
    });

    if (!target) {
      throw new Error(`Document with id ${id} not found`);
    }

    // トランザクション内で再帰的に複製
    const duplicated = await prisma.$transaction(async (tx) => {
      async function duplicateNode(
        nodeId: number,
        newParentId: number | null,
        isRoot: boolean
      ): Promise<any> {
        const node = await tx.document.findUnique({
          where: { id: nodeId },
        });

        if (!node) {
          throw new Error(`Document with id ${nodeId} not found`);
        }

        const newName = isRoot ? `${node.name}のコピー` : node.name;

        const created = await tx.document.create({
          data: {
            name: newName,
            type: node.type,
            parentId: newParentId,
            content: node.content,
          },
        });

        if (node.type === 'folder') {
          const children = await tx.document.findMany({
            where: { parentId: nodeId },
            orderBy: { id: 'asc' },
          });

          for (const child of children) {
            await duplicateNode(child.id, created.id, false);
          }
        }

        return created;
      }

      return duplicateNode(id, target.parentId, true);
    });

    return {
      ...duplicated,
      type: duplicated.type as DocumentType,
    };
  },
};
