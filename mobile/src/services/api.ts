import axios from 'axios';
import Constants from 'expo-constants';
import { CatalogTask, ActiveTask, Household, HighscoreEntry, UserTaskStat } from '../types';
import { storageService } from './storage';

// Determine Base URL and normalize so /api/ endpoints join cleanly
const getBaseUrl = (): string => {
  let url = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || Constants.expoConfig?.extra?.apiUrl;

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  
  // If URL ends with /api, strip it so /api/... routes don't duplicate
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }

  return url;
};

const getAuthToken = (): string => {
  return process.env.EXPO_PUBLIC_AUTH_TOKEN || process.env.AUTH_TOKEN;
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

// Request Interceptor: Attach User & Household identity headers for server logging
apiClient.interceptors.request.use(async (config) => {
  try {
    const userName = await storageService.getUserName();
    const household = await storageService.getHousehold();
    if (userName) {
      config.headers['X-User-Name'] = encodeURIComponent(userName);
    }
    if (household?.name) {
      config.headers['X-Household-Name'] = encodeURIComponent(household.name);
    }
  } catch {
    // Ignore storage read failures
  }
  return config;
});

export const getApiErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred.';

  const targetUrl = apiClient.defaults.baseURL || 'server';

  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail || error.response.data?.message;

    if (status === 401 || status === 403) {
      return `Authentication Error (${status}): Invalid or missing authorization token. Please check EXPO_PUBLIC_AUTH_TOKEN.${detail ? ` Details: ${detail}` : ''}`;
    }
    if (status === 404) {
      return `API Endpoint Not Found (404): Tried '${targetUrl}${error.config?.url || ''}'. Check EXPO_PUBLIC_API_URL setting.${detail ? ` Details: ${detail}` : ''}`;
    }
    if (status >= 500) {
      return `Server Internal Error (${status}): '${targetUrl}'. ${detail || 'Please check backend server logs.'}`;
    }
    return detail || `HTTP Request Failed (${status}).`;
  }

  if (error.request || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
    const fullAttemptedUrl = `${targetUrl}${error.config?.url || ''}`;
    const envSetting = process.env.EXPO_PUBLIC_API_URL || 'NOT_SET';
    return `Server Connection Failed: Unable to reach '${fullAttemptedUrl}'. [Configured EXPO_PUBLIC_API_URL: ${envSetting}]. Check server availability or phone network.`;
  }

  return error.message || 'An unexpected network error occurred.';
};

// Response Interceptor: Format error messages & log
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const userMsg = getApiErrorMessage(error);
    if (error) {
      error.userFacingMessage = userMsg;
    }
    console.error(`[HTTP Error] ${userMsg}`);
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

export const setClientContext = (userUuid?: string, userName?: string, householdId?: number, householdName?: string) => {
  if (userUuid) apiClient.defaults.headers.common['X-User-Uuid'] = userUuid;
  if (userName) apiClient.defaults.headers.common['X-User-Name'] = userName;
  if (householdId) apiClient.defaults.headers.common['X-Household-Id'] = householdId.toString();
  if (householdName) apiClient.defaults.headers.common['X-Household-Name'] = householdName;
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
export const markTaskDone = async (
  activeTaskId: number,
  userUuid?: string,
  userUuids?: string[]
): Promise<{ last_done_date: string; points_awarded: number }> => {
  const payload: any = {};
  if (userUuids && userUuids.length > 0) {
    payload.user_uuids = userUuids;
    payload.user_uuid = userUuids[0];
  } else if (userUuid) {
    payload.user_uuid = userUuid;
    payload.user_uuids = [userUuid];
  }
  const res = await apiClient.post(`/api/active-tasks/${activeTaskId}/mark-done`, payload);
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
