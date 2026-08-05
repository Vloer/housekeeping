import AsyncStorage from '@react-native-async-storage/async-storage';
import { Household } from '../types';

const KEYS = {
  HOUSEHOLD: '@housekeeping_household',
  RECENT_HOUSEHOLDS: '@housekeeping_recent_households',
  USER_UUID: '@housekeeping_user_uuid',
  USER_NAME: '@housekeeping_user_name',
};

export const storageService = {
  async getUserUuid(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER_UUID);
  },

  async setUserUuid(uuid: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_UUID, uuid);
  },

  async getUserName(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.USER_NAME);
  },

  async setUserName(name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_NAME, name);
  },

  async getHousehold(): Promise<Household | null> {
    const json = await AsyncStorage.getItem(KEYS.HOUSEHOLD);
    return json ? JSON.parse(json) : null;
  },

  async setHousehold(h: Household | null): Promise<void> {
    if (!h) {
      await AsyncStorage.removeItem(KEYS.HOUSEHOLD);
    } else {
      await AsyncStorage.setItem(KEYS.HOUSEHOLD, JSON.stringify(h));
    }
  },

  async getRecentHouseholds(): Promise<Household[]> {
    const json = await AsyncStorage.getItem(KEYS.RECENT_HOUSEHOLDS);
    return json ? JSON.parse(json) : [];
  },

  async saveRecentHousehold(h: Household): Promise<Household[]> {
    const current = await this.getRecentHouseholds();
    const filtered = current.filter((item) => item.household_id !== h.household_id);
    const updated = [h, ...filtered];
    await AsyncStorage.setItem(KEYS.RECENT_HOUSEHOLDS, JSON.stringify(updated));
    return updated;
  },

  async removeRecentHousehold(householdId: number): Promise<Household[]> {
    const current = await this.getRecentHouseholds();
    const updated = current.filter((item) => item.household_id !== householdId);
    await AsyncStorage.setItem(KEYS.RECENT_HOUSEHOLDS, JSON.stringify(updated));
    return updated;
  },
};
