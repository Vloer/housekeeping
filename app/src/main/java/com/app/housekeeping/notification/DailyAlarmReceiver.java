package com.app.housekeeping.notification;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.model.ActiveTask;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class DailyAlarmReceiver extends BroadcastReceiver {

    public static final int ALARM_REQUEST_CODE = 9001;

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationHelper.createNotificationChannel(context);
        
        TaskRepository repository = TaskRepository.getInstance(context);
        List<ActiveTask> tasksDue = repository.getTasksDueForNotification();
        
        if (tasksDue != null && !tasksDue.isEmpty()) {
            List<String> taskNames = new ArrayList<>();
            List<Integer> taskIds = new ArrayList<>();
            
            for (ActiveTask task : tasksDue) {
                taskNames.add(task.getTaskName());
                taskIds.add(task.getId());
            }
            
            NotificationHelper.showTaskNotification(context, taskNames);
            repository.markNotified(taskIds);
        }
        
        // Reschedule for tomorrow
        scheduleDailyAlarm(context);
    }

    public static void scheduleDailyAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                return; // Cannot schedule exact alarms without permission
            }
        }

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

        alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.getTimeInMillis(),
                pendingIntent
        );
    }
}
