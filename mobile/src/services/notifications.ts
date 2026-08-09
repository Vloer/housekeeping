import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ActiveTask } from '../types';
import i18n, { t, getTaskName } from '../i18n';
import { getThisWeekBounds } from '../utils/dateUtils';

// Check if running inside standard Expo Go app
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
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

export const buildNotificationBody = (
  activeTasks: ActiveTask[],
  forceMonday?: boolean,
  activeI18n: typeof i18n = i18n
): string => {
  const overdueCount = activeTasks.filter((t) => t.days_overdue > 0).length;

  const dueTodayTasks = activeTasks.filter((t) => t.days_overdue === 0);
  const dueTodayNames = dueTodayTasks.map((t) => getTaskName(t.task_name));

  const now = new Date();
  const isMonday = forceMonday !== undefined ? forceMonday : now.getDay() === 1;

  let dueThisWeekNames: string[] = [];
  if (isMonday) {
    const { mondayStr, sundayStr } = getThisWeekBounds();
    const dueThisWeekTasks = activeTasks.filter(
      (t) => t.due_date && t.due_date >= mondayStr && t.due_date <= sundayStr
    );
    dueThisWeekNames = dueThisWeekTasks.map((t) => getTaskName(t.task_name));
  }

  const lines: string[] = [];

  if (overdueCount > 0) {
    lines.push(t(activeI18n.notifications.overdueCount, { count: overdueCount }));
  }

  if (dueTodayNames.length > 0) {
    lines.push(t(activeI18n.notifications.dueTodayTasks, { tasks: dueTodayNames.join(', ') }));
  }

  if (isMonday && dueThisWeekNames.length > 0) {
    lines.push(t(activeI18n.notifications.dueThisWeekTasks, { tasks: dueThisWeekNames.join(', ') }));
  }

  return lines.join('\n');
};

export const scheduleDailyTaskReminder = async (activeTasks: ActiveTask[]) => {
  if (isExpoGo) {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const body = buildNotificationBody(activeTasks);
    if (!body) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.notifications.reminderTitle,
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


