import axios from 'axios';
import type {
  DocumentListItem,
  DocumentItem,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  MoveDocumentRequest,
} from '../../../shared/types/documents';

const client = axios.create({
  baseURL: '/api/documents',
});

export const documentsApi = {
  // 指定階層の子要素一覧を取得（本文なし）
  getDocuments: async (parentId?: number | null): Promise<DocumentListItem[]> => {
    const res = await client.get<DocumentListItem[]>('/', {
      params: { parentId: parentId ?? 'null' },
    });
    return res.data;
  },

  // 単一ドキュメントの詳細を取得（本文あり）
  getDocument: async (id: number): Promise<DocumentItem> => {
    const res = await client.get<DocumentItem>(`/${id}`);
    return res.data;
  },

  // フォルダ/ドキュメント作成
  createDocument: async (data: CreateDocumentRequest): Promise<DocumentItem> => {
    const res = await client.post<DocumentItem>('/', data);
    return res.data;
  },

  // 名前・本文更新
  updateDocument: async (id: number, data: UpdateDocumentRequest): Promise<DocumentItem> => {
    const res = await client.put<DocumentItem>(`/${id}`, data);
    return res.data;
  },

  // 削除
  deleteDocument: async (id: number): Promise<{ success: boolean }> => {
    const res = await client.delete<{ success: boolean }>(`/${id}`);
    return res.data;
  },

  // フォルダ移動
  moveDocument: async (id: number, data: MoveDocumentRequest): Promise<DocumentItem> => {
    const res = await client.put<DocumentItem>(`/${id}/move`, data);
    return res.data;
  },

  // 複製
  duplicateDocument: async (id: number): Promise<DocumentItem> => {
    const res = await client.post<DocumentItem>(`/${id}/duplicate`);
    return res.data;
  },
};
