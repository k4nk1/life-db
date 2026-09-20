export interface Tag {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
}

export interface FactSupplement {
  id: number;
  entryId: number;
  content: string;
  createdAt: string | Date;
}

export interface FactEntryItem {
  id: number;
  title: string;
  content: string | null;
  createdAt: string | Date;
  tags: Tag[];
  supplements: {
    id: number;
    content: string;
    createdAt: string | Date;
  }[];
}

export interface GetFactsParams {
  page?: number | undefined;
  limit?: number | undefined;
  tags?: string | number[] | undefined;
  search?: string | undefined;
}

export interface GetFactsResponse {
  items: FactEntryItem[];
  total: number;
}

export interface CreateFactEntryRequest {
  title: string;
  content?: string | null | undefined;
  tagIds?: number[] | undefined;
}

export interface UpdateFactEntryRequest {
  title?: string | undefined;
  content?: string | null | undefined;
  tagIds?: number[] | undefined;
}

export interface CreateSupplementRequest {
  content: string;
}

export interface UpdateSupplementRequest {
  content: string;
}

export interface RandomFactResponse {
  id: number;
  title: string;
  content: string | null;
  createdAt: string | Date;
  tags: {
    id: number;
    name: string;
    color: string;
  }[];
}

export interface CreateTagRequest {
  name: string;
  color: string;
  sortOrder?: number | undefined;
}

export interface UpdateTagRequest {
  name?: string | undefined;
  color?: string | undefined;
  sortOrder?: number | undefined;
}
