export interface Household {
  household_id: number;
  name: string;
  join_code: string;
  username: string;
}

export interface CatalogTask {
  id: number;
  name: string;
  is_custom: boolean;
  default_frequency_days: number;
  is_active: boolean;
  active_id: number | null;
  frequency_days: number;
  last_done_date: string | null;
  due_date: string | null;
}

export interface ActiveTask {
  id: number;
  catalog_task_id: number;
  task_name: string;
  frequency_days: number;
  last_done_date: string | null;
  due_date: string | null;
  days_overdue: number;
}

export interface HighscoreEntry {
  rank: number;
  user_uuid: string;
  username: string;
  points: number;
}

export interface UserTaskStat {
  task_name: string;
  completions_count: number;
  total_points: number;
}

export type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_NEEDED' | 'ALL';
