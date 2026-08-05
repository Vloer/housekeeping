import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ActiveTask } from '../types';

// Check if running inside standard Expo Go app
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('Notification handler initialization skipped:', err);
  }
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (isExpoGo) {
    // Expo Go removes push/remote notification handlers in SDK 53+
    return false;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
    return false;
  }
};

export const scheduleDailyTaskReminder = async (activeTasks: ActiveTask[]) => {
  if (isExpoGo) {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const overdueTasks = activeTasks.filter((t) => t.days_overdue > 0);
    const dueTodayTasks = activeTasks.filter((t) => t.days_overdue === 0);

    if (overdueTasks.length === 0 && dueTodayTasks.length === 0) {
      return;
    }

    let body = '';
    if (overdueTasks.length > 0) {
      body = `You have ${overdueTasks.length} overdue housekeeping task(s)!`;
    } else {
      body = `You have ${dueTodayTasks.length} task(s) due today.`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏠 Housekeeping Reminder',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (err) {
    console.warn('Failed to schedule daily notification:', err);
  }
};
