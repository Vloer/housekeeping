package com.app.housekeeping.notification;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.model.ActiveTask;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class DailyAlarmReceiver extends BroadcastReceiver {

    public static final int ALARM_REQUEST_CODE = 9001;

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationHelper.createNotificationChannel(context);
        
        HouseholdManager hm = HouseholdManager.getInstance(context);
        TaskRepository repository = TaskRepository.getInstance(context);

        if (hm.hasHousehold()) {
            repository.getActiveTasksNetwork(hm.getHouseholdId(), new TaskRepository.RepositoryCallback<List<ActiveTask>>() {
                @Override
                public void onSuccess(List<ActiveTask> tasks) {
                    checkAndNotify(context, repository, tasks);
                    scheduleDailyAlarm(context);
                }

                @Override
                public void onError(String error) {
                    List<ActiveTask> tasks = repository.getTasksDueForNotification();
                    checkAndNotify(context, repository, tasks);
                    scheduleDailyAlarm(context);
                }
            });
        } else {
            List<ActiveTask> tasks = repository.getTasksDueForNotification();
            checkAndNotify(context, repository, tasks);
            scheduleDailyAlarm(context);
        }
    }

    private void checkAndNotify(Context context, TaskRepository repository, List<ActiveTask> tasks) {
        if (tasks == null || tasks.isEmpty()) return;

        List<String> dueTaskNames = new ArrayList<>();
        List<Integer> dueTaskIds = new ArrayList<>();

        for (ActiveTask task : tasks) {
            if (task.getDaysOverdue() >= 0) {
                dueTaskNames.add(task.getTaskName());
                dueTaskIds.add(task.getId());
            }
        }

        if (!dueTaskNames.isEmpty()) {
            NotificationHelper.showTaskNotification(context, dueTaskNames);
            repository.markNotified(dueTaskIds);
        }
    }

    public static void scheduleDailyAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, DailyAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                ALARM_REQUEST_CODE, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 9);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.getTimeInMillis(),
                    pendingIntent
            );
        } else {
            alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.getTimeInMillis(),
                    pendingIntent
            );
        }
    }
}
