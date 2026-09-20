export interface ActionSubtype {
  id: number;
  name: string;
  typeId: number;
  sortOrder: number;
}

export interface ActionType {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  subtypes?: ActionSubtype[];
}

export interface Action {
  id: number;
  subtypeId: number;
  startMinutes: number;
  endMinutes: number;
  detail: string | null;
}

export interface DailyRecord {
  id: number;
  date: string;
  goal: string | null;
  reflection: string | null;
  actions: Action[];
}

export interface DailyStats {
  id: number;
  name: string;
  typeName?: string | undefined;
  color: string;
  totalMinutes: number;
  percentage: number;
  dailyAverageMinutes: number;
}

export interface UpdateDailyRecordRequest {
  goal?: string;
  reflection?: string;
}

export interface CreateActionRequest {
  subtypeId: number;
  startMinutes: number;
  endMinutes: number;
  detail?: string;
}

export interface UpdateActionRequest {
  subtypeId?: number;
  startMinutes?: number;
  endMinutes?: number;
  detail?: string;
}

export interface CreateActionTypeRequest {
  name: string;
  color: string;
  sortOrder: number;
}

export interface UpdateActionTypeRequest {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateActionSubtypeRequest {
  name: string;
  typeId: number;
  sortOrder: number;
}

export interface UpdateActionSubtypeRequest {
  name?: string;
  sortOrder?: number;
}
