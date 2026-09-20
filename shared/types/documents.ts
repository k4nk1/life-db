export type DocumentType = 'folder' | 'document';

export interface DocumentListItem {
  id: number;
  name: string;
  type: DocumentType;
  parentId: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DocumentItem {
  id: number;
  name: string;
  type: DocumentType;
  parentId: number | null;
  content: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface GetDocumentsParams {
  parentId?: number | null | undefined;
}

export interface CreateDocumentRequest {
  name: string;
  type: DocumentType;
  parentId?: number | null | undefined;
  content?: string | null | undefined;
}

export interface UpdateDocumentRequest {
  name?: string | undefined;
  content?: string | null | undefined;
}

export interface MoveDocumentRequest {
  parentId: number | null;
}
