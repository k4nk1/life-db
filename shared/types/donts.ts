export interface DontEntryItem {
  id: number;
  content: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
  review: string | null;
}

export interface DontEntry {
  id: number;
  content: string;
  createdAt: string | Date;
  deletedAt: string | Date | null;
}

export interface DontReview {
  id: number;
  entryId: number;
  weekStart: string;
  review: string;
}

export interface GetDontsParams {
  weekStart?: string | undefined;
}

export interface CreateDontEntryRequest {
  content: string;
}

export interface UpdateDontEntryRequest {
  content: string;
}

export interface UpdateDontReviewRequest {
  review: string;
}
