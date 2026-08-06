import axios from 'axios';
import Constants from 'expo-constants';
import { CatalogTask, ActiveTask, Household, HighscoreEntry, UserTaskStat } from '../types';

// Determine Base URL and normalize so /api/ endpoints join cleanly
const getBaseUrl = (): string => {
  let url = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  
  if (!url) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      url = `http://${ip}:8000`;
    } else {
      url = 'http://10.0.2.2:8000';
    }
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  
  // If URL ends with /api, strip it so /api/... routes don't duplicate
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }

  return url;
};

const getAuthToken = (): string => {
  return process.env.EXPO_PUBLIC_AUTH_TOKEN || process.env.AUTH_TOKEN || 'hk_secret_token_2026';
};

const BASE_URL = getBaseUrl();
const API_TOKEN = getAuthToken();

console.log(`[API Client] Target Server Origin: ${BASE_URL}`);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  },
  timeout: 10000,
});

// Response Interceptor: Log errors only
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[HTTP Server Error] ${error.response.status} <- ${error.config?.url}:`, JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error(`[HTTP Network Error] Unable to connect to ${apiClient.defaults.baseURL}${error.config?.url}. Check server connectivity.`);
    } else {
      console.error('[HTTP Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export const setBaseUrl = (url: string) => {
  let normalized = url.replace(/\/+$/, '');
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  apiClient.defaults.baseURL = normalized;
  console.log(`[API Client] Base URL updated to: ${normalized}`);
};

// Household APIs
export const checkJoinHousehold = async (joinCode: string, userUuid: string): Promise<{ household_id: number; name: string; join_code: string; is_member: boolean; existing_username: string | null }> => {
  const res = await apiClient.post('/api/households/check-join', { join_code: joinCode, user_uuid: userUuid });
  return res.data;
};

export const createHousehold = async (name: string, userName: string, userUuid: string): Promise<Household> => {
  const res = await apiClient.post('/api/households/create', { name, user_name: userName, user_uuid: userUuid });
  return res.data;
};

export const joinHousehold = async (joinCode: string, userName: string, userUuid: string): Promise<Household> => {
  const res = await apiClient.post('/api/households/join', { join_code: joinCode, user_name: userName, user_uuid: userUuid });
  return res.data;
};

export const getHouseholdInfo = async (householdId: number): Promise<Household> => {
  const res = await apiClient.get(`/api/households/${householdId}/info`);
  return res.data;
};

// Tasks & Catalog APIs
export const getCatalogTasks = async (householdId: number): Promise<CatalogTask[]> => {
  const res = await apiClient.get(`/api/households/${householdId}/catalog`);
  return res.data;
};

export const getActiveTasks = async (householdId: number): Promise<ActiveTask[]> => {
  const res = await apiClient.get(`/api/households/${householdId}/active`);
  return res.data;
};

export const activateTask = async (householdId: number, catalogTaskId: number, frequencyDays: number): Promise<void> => {
  await apiClient.post(`/api/households/${householdId}/activate`, {
    catalog_task_id: catalogTaskId,
    frequency_days: frequencyDays,
  });
};

export const deactivateTask = async (householdId: number, catalogTaskId: number): Promise<void> => {
  await apiClient.post(`/api/households/${householdId}/deactivate`, {
    catalog_task_id: catalogTaskId,
  });
};

export const addCustomTask = async (householdId: number, name: string, defaultFrequencyDays: number): Promise<number> => {
  const res = await apiClient.post(`/api/households/${householdId}/custom-task`, {
    name,
    default_frequency_days: defaultFrequencyDays,
  });
  return res.data.catalog_task_id;
};

export const updateTask = async (householdId: number, catalogTaskId: number, name: string, frequencyDays: number): Promise<void> => {
  await apiClient.post(`/api/households/${householdId}/update-task`, {
    catalog_task_id: catalogTaskId,
    name,
    frequency_days: frequencyDays,
  });
};

export const deleteTask = async (householdId: number, catalogTaskId: number): Promise<void> => {
  await apiClient.post(`/api/households/${householdId}/delete-task`, {
    catalog_task_id: catalogTaskId,
  });
};

// Active Task Operations
export const markTaskDone = async (activeTaskId: number, userUuid: string): Promise<{ last_done_date: string; points_awarded: number }> => {
  const res = await apiClient.post(`/api/active-tasks/${activeTaskId}/mark-done`, {
    user_uuid: userUuid,
  });
  return res.data;
};

export const updateTaskLastDone = async (activeTaskId: number, lastDoneDate: string): Promise<void> => {
  await apiClient.post(`/api/active-tasks/${activeTaskId}/update-last-done`, {
    last_done_date: lastDoneDate,
  });
};

export const updateTaskDueDate = async (activeTaskId: number, dueDate: string, frequencyDays: number): Promise<string> => {
  const res = await apiClient.post(`/api/active-tasks/${activeTaskId}/update-due-date`, {
    due_date: dueDate,
    frequency_days: frequencyDays,
  });
  return res.data.calculated_last_done;
};

// Highscores APIs
export const getHouseholdHighscores = async (householdId: number): Promise<HighscoreEntry[]> => {
  const res = await apiClient.get(`/api/highscores/household/${householdId}`);
  return res.data;
};

export const getGlobalHighscores = async (): Promise<HighscoreEntry[]> => {
  const res = await apiClient.get('/api/highscores/global');
  return res.data;
};

export const getUserTaskStats = async (householdId: number, userUuid: string): Promise<UserTaskStat[]> => {
  const res = await apiClient.get(`/api/highscores/household/${householdId}/user/${userUuid}/tasks`);
  return res.data;
};
