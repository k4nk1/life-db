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

import { documentsService } from '../src/services/documents';
import documentsRouter from '../src/routes/documents';

describe('Documents Service & Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/documents', documentsRouter);

  beforeAll(async () => {
    await prisma.document.deleteMany();
  });

  afterAll(async () => {
    await prisma.document.deleteMany();
    await prisma.$disconnect();
  });

  describe('Service: CRUD & Tree logic', () => {
    let folderId: number;
    let docId: number;
    let childDocId: number;

    it('creates a folder', async () => {
      const folder = await documentsService.createDocument({
        name: 'プロジェクト資料',
        type: 'folder',
      });
      expect(folder.id).toBeDefined();
      expect(folder.name).toBe('プロジェクト資料');
      expect(folder.type).toBe('folder');
      expect(folder.parentId).toBeNull();
      expect(folder.content).toBeNull();
      folderId = folder.id;
    });

    it('creates a document with content in root', async () => {
      const doc = await documentsService.createDocument({
        name: '仕様書',
        type: 'document',
        content: '# 要件定義\n- 項目1\n- 項目2',
      });
      expect(doc.id).toBeDefined();
      expect(doc.name).toBe('仕様書');
      expect(doc.type).toBe('document');
      expect(doc.parentId).toBeNull();
      expect(doc.content).toBe('# 要件定義\n- 項目1\n- 項目2');
      docId = doc.id;
    });

    it('creates a child document inside a folder', async () => {
      const childDoc = await documentsService.createDocument({
        name: '設計書',
        type: 'document',
        parentId: folderId,
        content: '## 設計メモ',
      });
      expect(childDoc.parentId).toBe(folderId);
      childDocId = childDoc.id;
    });

    it('gets child items of root without content', async () => {
      const rootDocs = await documentsService.getDocuments(null);
      expect(rootDocs.length).toBeGreaterThanOrEqual(2);
      const foundFolder = rootDocs.find((d) => d.id === folderId);
      const foundDoc = rootDocs.find((d) => d.id === docId);
      expect(foundFolder).toBeDefined();
      expect(foundDoc).toBeDefined();
      expect((foundDoc as any).content).toBeUndefined();
    });

    it('gets child items of a folder', async () => {
      const folderChildren = await documentsService.getDocuments(folderId);
      expect(folderChildren).toHaveLength(1);
      expect(folderChildren[0]?.id).toBe(childDocId);
    });

    it('gets a single document with content', async () => {
      const doc = await documentsService.getDocumentById(docId);
      expect(doc).not.toBeNull();
      expect(doc?.id).toBe(docId);
      expect(doc?.content).toBe('# 要件定義\n- 項目1\n- 項目2');
    });

    it('updates document name and content', async () => {
      const updated = await documentsService.updateDocument(docId, {
        name: '基本仕様書',
        content: '# 更新された要件定義',
      });
      expect(updated.name).toBe('基本仕様書');
      expect(updated.content).toBe('# 更新された要件定義');
    });

    it('moves a document to another folder', async () => {
      const moved = await documentsService.moveDocument(docId, folderId);
      expect(moved.parentId).toBe(folderId);

      const folderChildren = await documentsService.getDocuments(folderId);
      expect(folderChildren.map((d) => d.id)).toContain(docId);
    });

    it('moves a document back to root', async () => {
      const moved = await documentsService.moveDocument(docId, null);
      expect(moved.parentId).toBeNull();
    });

    it('duplicates a single document with "元の名前のコピー"', async () => {
      const duplicated = await documentsService.duplicateDocument(docId);
      expect(duplicated.id).not.toBe(docId);
      expect(duplicated.name).toBe('基本仕様書のコピー');
      expect(duplicated.content).toBe('# 更新された要件定義');
      expect(duplicated.parentId).toBeNull();
    });

    it('duplicates a folder recursively with all children', async () => {
      // フォルダ構造作成: 親フォルダ -> サブフォルダ -> 子ドキュメント
      const parentFolder = await documentsService.createDocument({
        name: '元フォルダ',
        type: 'folder',
      });
      const subFolder = await documentsService.createDocument({
        name: 'サブフォルダ',
        type: 'folder',
        parentId: parentFolder.id,
      });
      const fileInSub = await documentsService.createDocument({
        name: '深いファイル',
        type: 'document',
        parentId: subFolder.id,
        content: 'ファイル本文',
      });

      // 複製実行
      const duplicatedFolder = await documentsService.duplicateDocument(parentFolder.id);
      expect(duplicatedFolder.id).not.toBe(parentFolder.id);
      expect(duplicatedFolder.name).toBe('元フォルダのコピー');

      // 複製されたサブフォルダの検証
      const dupSubChildren = await documentsService.getDocuments(duplicatedFolder.id);
      expect(dupSubChildren).toHaveLength(1);
      const dupSub = dupSubChildren[0]!;
      expect(dupSub.name).toBe('サブフォルダ');
      expect(dupSub.type).toBe('folder');

      // 複製されたサブフォルダ内のファイルの検証
      const dupDeepChildren = await documentsService.getDocuments(dupSub.id);
      expect(dupDeepChildren).toHaveLength(1);
      const dupFile = dupDeepChildren[0]!;
      expect(dupFile.name).toBe('深いファイル');
      expect(dupFile.type).toBe('document');

      const deepFileDetail = await documentsService.getDocumentById(dupFile.id);
      expect(deepFileDetail?.content).toBe('ファイル本文');
    });

    it('deletes a document', async () => {
      const target = await documentsService.createDocument({
        name: '削除対象ドキュメント',
        type: 'document',
      });
      const result = await documentsService.deleteDocument(target.id);
      expect(result.success).toBe(true);

      const found = await documentsService.getDocumentById(target.id);
      expect(found).toBeNull();
    });

    it('deletes a folder and cascades to all its children', async () => {
      const folderToDelete = await documentsService.createDocument({
        name: '削除対象フォルダ',
        type: 'folder',
      });
      const child = await documentsService.createDocument({
        name: 'カスケード削除対象',
        type: 'document',
        parentId: folderToDelete.id,
      });

      await documentsService.deleteDocument(folderToDelete.id);

      const foundFolder = await documentsService.getDocumentById(folderToDelete.id);
      const foundChild = await documentsService.getDocumentById(child.id);
      expect(foundFolder).toBeNull();
      expect(foundChild).toBeNull();
    });
  });

  describe('API Routes: /api/documents', () => {
    let apiFolderId: number;
    let apiDocId: number;

    it('POST /api/documents creates a folder', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({ name: 'APIテストフォルダ', type: 'folder' });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('APIテストフォルダ');
      expect(res.body.type).toBe('folder');
      apiFolderId = res.body.id;
    });

    it('POST /api/documents creates a document with content', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          name: 'APIテストドキュメント',
          type: 'document',
          parentId: apiFolderId,
          content: '本文テスト',
        });
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('APIテストドキュメント');
      expect(res.body.parentId).toBe(apiFolderId);
      expect(res.body.content).toBe('本文テスト');
      apiDocId = res.body.id;
    });

    it('GET /api/documents gets root level items without content', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((d: any) => d.id === apiFolderId);
      expect(found).toBeDefined();
      expect(found.content).toBeUndefined();
    });

    it('GET /api/documents?parentId=:id gets folder items', async () => {
      const res = await request(app).get(`/api/documents?parentId=${apiFolderId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((d: any) => d.id === apiDocId);
      expect(found).toBeDefined();
    });

    it('GET /api/documents/:id gets document detail with content', async () => {
      const res = await request(app).get(`/api/documents/${apiDocId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(apiDocId);
      expect(res.body.content).toBe('本文テスト');
    });

    it('PUT /api/documents/:id updates document', async () => {
      const res = await request(app)
        .put(`/api/documents/${apiDocId}`)
        .send({ name: '更新後APIドキュメント', content: '更新後本文' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('更新後APIドキュメント');
      expect(res.body.content).toBe('更新後本文');
    });

    it('PUT /api/documents/:id/move moves document', async () => {
      const res = await request(app)
        .put(`/api/documents/${apiDocId}/move`)
        .send({ parentId: null });
      expect(res.status).toBe(200);
      expect(res.body.parentId).toBeNull();
    });

    it('POST /api/documents/:id/duplicate duplicates document', async () => {
      const res = await request(app).post(`/api/documents/${apiDocId}/duplicate`);
      expect(res.status).toBe(200);
      expect(res.body.id).not.toBe(apiDocId);
      expect(res.body.name).toBe('更新後APIドキュメントのコピー');
    });

    it('DELETE /api/documents/:id deletes document', async () => {
      const res = await request(app).delete(`/api/documents/${apiDocId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app).get(`/api/documents/${apiDocId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
