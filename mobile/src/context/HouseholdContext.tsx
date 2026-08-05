import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Household, ActiveTask, CatalogTask, HighscoreEntry } from '../types';
import * as api from '../services/api';
import { scheduleDailyTaskReminder, requestNotificationPermissions } from '../services/notifications';

const HOUSEHOLD_STORAGE_KEY = '@housekeeping_household';
const RECENT_HOUSEHOLDS_KEY = '@housekeeping_recent_households';
const USER_UUID_STORAGE_KEY = '@housekeeping_user_uuid';
const USER_NAME_STORAGE_KEY = '@housekeeping_user_name';

interface HouseholdContextType {
  household: Household | null;
  recentHouseholds: Household[];
  userUuid: string;
  userName: string;
  activeTasks: ActiveTask[];
  catalogTasks: CatalogTask[];
  highscores: HighscoreEntry[];
  loading: boolean;
  setUserProfileName: (name: string) => Promise<void>;
  checkJoinHousehold: (joinCode: string) => Promise<{ household_id: number; name: string; join_code: string; is_member: boolean; existing_username: string | null }>;
  createHousehold: (name: string, userName: string) => Promise<void>;
  joinHousehold: (joinCode: string, userName: string) => Promise<void>;
  connectRecentHousehold: (h: Household) => Promise<void>;
  removeRecentHousehold: (householdId: number) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  refreshData: () => Promise<void>;
  markTaskDoneOptimistic: (activeTaskId: number) => Promise<{ points: number }>;
  activateTaskOptimistic: (catalogTaskId: number, frequencyDays: number) => Promise<void>;
  deactivateTaskOptimistic: (catalogTaskId: number) => Promise<void>;
  addCustomTaskOptimistic: (name: string, frequencyDays: number) => Promise<void>;
  deleteTaskOptimistic: (catalogTaskId: number) => Promise<void>;
  updateTaskLastDoneOptimistic: (activeTaskId: number, lastDoneDate: string) => Promise<void>;
  updateTaskDetailsOptimistic: (catalogTaskId: number, name: string, frequencyDays: number) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [recentHouseholds, setRecentHouseholds] = useState<Household[]>([]);
  const [userUuid, setUserUuid] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [catalogTasks, setCatalogTasks] = useState<CatalogTask[]>([]);
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize or load user identity & household state
  useEffect(() => {
    const initStorage = async () => {
      try {
        let storedUuid = await AsyncStorage.getItem(USER_UUID_STORAGE_KEY);
        if (!storedUuid) {
          storedUuid = Crypto.randomUUID();
          await AsyncStorage.setItem(USER_UUID_STORAGE_KEY, storedUuid);
        }
        setUserUuid(storedUuid);

        const storedName = await AsyncStorage.getItem(USER_NAME_STORAGE_KEY);
        if (storedName) setUserName(storedName);

        const storedHouseholdJson = await AsyncStorage.getItem(HOUSEHOLD_STORAGE_KEY);
        if (storedHouseholdJson) {
          const parsedHousehold: Household = JSON.parse(storedHouseholdJson);
          setHousehold(parsedHousehold);
        }

        const storedRecentsJson = await AsyncStorage.getItem(RECENT_HOUSEHOLDS_KEY);
        if (storedRecentsJson) {
          setRecentHouseholds(JSON.parse(storedRecentsJson));
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
      } finally {
        setLoading(false);
      }
    };
    initStorage();
  }, []);

  // Fetch data whenever household changes
  useEffect(() => {
    if (household?.household_id) {
      refreshData();
      requestNotificationPermissions();
    }
  }, [household?.household_id]);

  const saveToRecentHouseholds = async (h: Household) => {
    const filtered = recentHouseholds.filter((item) => item.household_id !== h.household_id);
    const updated = [h, ...filtered];
    setRecentHouseholds(updated);
    await AsyncStorage.setItem(RECENT_HOUSEHOLDS_KEY, JSON.stringify(updated));
  };

  const removeRecentHousehold = async (householdId: number) => {
    const updated = recentHouseholds.filter((item) => item.household_id !== householdId);
    setRecentHouseholds(updated);
    await AsyncStorage.setItem(RECENT_HOUSEHOLDS_KEY, JSON.stringify(updated));
  };

  const refreshData = async () => {
    if (!household?.household_id) return;
    try {
      setLoading(true);
      const [active, catalog, scores] = await Promise.all([
        api.getActiveTasks(household.household_id),
        api.getCatalogTasks(household.household_id),
        api.getHouseholdHighscores(household.household_id),
      ]);
      setActiveTasks(active);
      setCatalogTasks(catalog);
      setHighscores(scores);
      scheduleDailyTaskReminder(active);
    } catch (err) {
      console.error('Error refreshing data from server:', err);
    } finally {
      setLoading(false);
    }
  };

  const setUserProfileName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    await AsyncStorage.setItem(USER_NAME_STORAGE_KEY, trimmed);
  };

  const checkJoinHousehold = async (joinCode: string) => {
    return await api.checkJoinHousehold(joinCode, userUuid);
  };

  const createHousehold = async (name: string, uName: string) => {
    let uuid = userUuid;
    if (!uuid) {
      uuid = Crypto.randomUUID();
      setUserUuid(uuid);
      await AsyncStorage.setItem(USER_UUID_STORAGE_KEY, uuid);
    }
    const res = await api.createHousehold(name, uName, uuid);
    setHousehold(res);
    setUserName(uName);
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(res));
    await AsyncStorage.setItem(USER_NAME_STORAGE_KEY, uName);
    await saveToRecentHouseholds(res);
  };

  const joinHousehold = async (joinCode: string, uName: string) => {
    let uuid = userUuid;
    if (!uuid) {
      uuid = Crypto.randomUUID();
      setUserUuid(uuid);
      await AsyncStorage.setItem(USER_UUID_STORAGE_KEY, uuid);
    }
    const res = await api.joinHousehold(joinCode, uName, uuid);
    setHousehold(res);
    setUserName(res.username);
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(res));
    await AsyncStorage.setItem(USER_NAME_STORAGE_KEY, res.username);
    await saveToRecentHouseholds(res);
  };

  const connectRecentHousehold = async (h: Household) => {
    setHousehold(h);
    setUserName(h.username);
    await AsyncStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(h));
    await AsyncStorage.setItem(USER_NAME_STORAGE_KEY, h.username);
    await saveToRecentHouseholds(h);
  };

  const leaveHousehold = async () => {
    setHousehold(null);
    setActiveTasks([]);
    setCatalogTasks([]);
    setHighscores([]);
    await AsyncStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
  };

  // Optimistic UI updates
  const markTaskDoneOptimistic = async (activeTaskId: number): Promise<{ points: number }> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const previousTasks = [...activeTasks];
    
    // Find task to get points
    const task = activeTasks.find((t) => t.id === activeTaskId);
    const pointsAwarded = task ? task.frequency_days : 0;

    // Optimistically update local active task list
    setActiveTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId
          ? { ...t, last_done_date: todayStr, days_overdue: -t.frequency_days }
          : t
      )
    );

    // Optimistically update highscore points
    setHighscores((prev) =>
      prev.map((h) =>
        h.user_uuid === userUuid
          ? { ...h, points: h.points + pointsAwarded }
          : h
      )
    );

    try {
      const res = await api.markTaskDone(activeTaskId, userUuid);
      refreshData();
      return { points: res.points_awarded };
    } catch (err) {
      // Revert on error
      setActiveTasks(previousTasks);
      console.error('Failed to mark task done:', err);
      throw err;
    }
  };

  const activateTaskOptimistic = async (catalogTaskId: number, frequencyDays: number) => {
    if (!household) return;
    setCatalogTasks((prev) =>
      prev.map((c) =>
        c.id === catalogTaskId ? { ...c, is_active: true, frequency_days: frequencyDays } : c
      )
    );
    try {
      await api.activateTask(household.household_id, catalogTaskId, frequencyDays);
      refreshData();
    } catch (err) {
      refreshData();
    }
  };

  const deactivateTaskOptimistic = async (catalogTaskId: number) => {
    if (!household) return;
    setCatalogTasks((prev) =>
      prev.map((c) => (c.id === catalogTaskId ? { ...c, is_active: false } : c))
    );
    try {
      await api.deactivateTask(household.household_id, catalogTaskId);
      refreshData();
    } catch (err) {
      refreshData();
    }
  };

  const addCustomTaskOptimistic = async (name: string, frequencyDays: number) => {
    if (!household) return;
    try {
      await api.addCustomTask(household.household_id, name, frequencyDays);
      refreshData();
    } catch (err) {
      console.error('Failed to add custom task:', err);
      throw err;
    }
  };

  const deleteTaskOptimistic = async (catalogTaskId: number) => {
    if (!household) return;
    setCatalogTasks((prev) => prev.filter((c) => c.id !== catalogTaskId));
    try {
      await api.deleteTask(household.household_id, catalogTaskId);
      refreshData();
    } catch (err) {
      refreshData();
    }
  };

  const updateTaskLastDoneOptimistic = async (activeTaskId: number, lastDoneDate: string) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t.id === activeTaskId ? { ...t, last_done_date: lastDoneDate } : t))
    );
    try {
      await api.updateTaskLastDone(activeTaskId, lastDoneDate);
      refreshData();
    } catch (err) {
      console.error('Failed to update task last done date:', err);
      refreshData();
    }
  };

  const updateTaskDetailsOptimistic = async (catalogTaskId: number, name: string, frequencyDays: number) => {
    if (!household) return;
    setCatalogTasks((prev) =>
      prev.map((c) => (c.id === catalogTaskId ? { ...c, name, frequency_days: frequencyDays, default_frequency_days: frequencyDays } : c))
    );
    try {
      await api.updateTask(household.household_id, catalogTaskId, name, frequencyDays);
      refreshData();
    } catch (err) {
      console.error('Failed to update task details:', err);
      refreshData();
    }
  };

  return (
    <HouseholdContext.Provider
      value={{
        household,
        recentHouseholds,
        userUuid,
        userName,
        activeTasks,
        catalogTasks,
        highscores,
        loading,
        setUserProfileName,
        checkJoinHousehold,
        createHousehold,
        joinHousehold,
        connectRecentHousehold,
        removeRecentHousehold,
        leaveHousehold,
        refreshData,
        markTaskDoneOptimistic,
        activateTaskOptimistic,
        deactivateTaskOptimistic,
        addCustomTaskOptimistic,
        deleteTaskOptimistic,
        updateTaskLastDoneOptimistic,
        updateTaskDetailsOptimistic,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};
