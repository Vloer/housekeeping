import i18n from '../i18n';

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

export const FREQUENCY_PRESETS = [
  { label: i18n.frequencyPresets.weekly, days: 7 },
  { label: i18n.frequencyPresets.biweekly, days: 14 },
  { label: i18n.frequencyPresets.monthly, days: 30 },
  { label: i18n.frequencyPresets.bimonthly, days: 60 },
  { label: i18n.frequencyPresets.quarterly, days: 90 },
  { label: i18n.frequencyPresets.halfYearly, days: 180 },
  { label: i18n.frequencyPresets.yearly, days: 365 },
] as const;

export type FrequencyPreset = typeof FREQUENCY_PRESETS[number];

