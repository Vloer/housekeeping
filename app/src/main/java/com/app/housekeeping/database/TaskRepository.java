package com.app.housekeeping.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.text.TextUtils;

import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.model.CatalogTask;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TaskRepository {

    private static TaskRepository instance;
    private final DatabaseHelper dbHelper;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

    private TaskRepository(Context context) {
        dbHelper = new DatabaseHelper(context.getApplicationContext());
    }

    public static synchronized TaskRepository getInstance(Context context) {
        if (instance == null) {
            instance = new TaskRepository(context);
        }
        return instance;
    }

    public List<CatalogTask> getAllCatalogTasks() {
        List<CatalogTask> tasks = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        
        String query = "SELECT c.id, c.name, c.is_custom, c.default_frequency_days, " +
                "a.id AS active_id, a.frequency_days " +
                "FROM task_catalog c " +
                "LEFT JOIN active_tasks a ON c.id = a.catalog_task_id " +
                "ORDER BY c.name ASC";
                
        try (Cursor cursor = db.rawQuery(query, null)) {
            if (cursor.moveToFirst()) {
                do {
                    CatalogTask task = new CatalogTask();
                    task.setId(cursor.getInt(cursor.getColumnIndexOrThrow("id")));
                    task.setName(cursor.getString(cursor.getColumnIndexOrThrow("name")));
                    task.setCustom(cursor.getInt(cursor.getColumnIndexOrThrow("is_custom")) == 1);
                    task.setDefaultFrequencyDays(cursor.getInt(cursor.getColumnIndexOrThrow("default_frequency_days")));
                    
                    int activeIdIndex = cursor.getColumnIndexOrThrow("active_id");
                    if (!cursor.isNull(activeIdIndex)) {
                        task.setActive(true);
                        task.setFrequencyDays(cursor.getInt(cursor.getColumnIndexOrThrow("frequency_days")));
                    } else {
                        task.setActive(false);
                        task.setFrequencyDays(task.getDefaultFrequencyDays());
                    }
                    
                    tasks.add(task);
                } while (cursor.moveToNext());
            }
        }
        return tasks;
    }

    public List<ActiveTask> getActiveTasks() {
        List<ActiveTask> tasks = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        
        String query = "SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date, " +
                "date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date, " +
                "CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue " +
                "FROM active_tasks a " +
                "JOIN task_catalog c ON a.catalog_task_id = c.id " +
                "WHERE a.last_done_date IS NULL " +
                "   OR julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) >= -2 " +
                "ORDER BY days_overdue DESC";
                
        try (Cursor cursor = db.rawQuery(query, null)) {
            if (cursor.moveToFirst()) {
                do {
                    ActiveTask task = mapActiveTask(cursor);
                    tasks.add(task);
                } while (cursor.moveToNext());
            }
        }
        return tasks;
    }

    public List<ActiveTask> getAllActiveTasksUnsorted() {
        List<ActiveTask> tasks = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        
        String query = "SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date, " +
                "date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date, " +
                "CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue " +
                "FROM active_tasks a " +
                "JOIN task_catalog c ON a.catalog_task_id = c.id";
                
        try (Cursor cursor = db.rawQuery(query, null)) {
            if (cursor.moveToFirst()) {
                do {
                    ActiveTask task = mapActiveTask(cursor);
                    tasks.add(task);
                } while (cursor.moveToNext());
            }
        }
        return tasks;
    }

    public void activateTask(int catalogTaskId, int frequencyDays) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("catalog_task_id", catalogTaskId);
        cv.put("frequency_days", frequencyDays);
        cv.put("notified_this_cycle", 0);
        db.insert("active_tasks", null, cv);
    }

    public void deactivateTask(int catalogTaskId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.delete("active_tasks", "catalog_task_id = ?", new String[]{String.valueOf(catalogTaskId)});
    }

    public void markDone(int activeTaskId) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("last_done_date", dateFormat.format(new Date()));
        cv.put("notified_this_cycle", 0);
        db.update("active_tasks", cv, "id = ?", new String[]{String.valueOf(activeTaskId)});
    }

    public void updateLastDoneDate(int activeTaskId, String lastDoneDate) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("last_done_date", lastDoneDate);
        cv.put("notified_this_cycle", 0);
        db.update("active_tasks", cv, "id = ?", new String[]{String.valueOf(activeTaskId)});
    }

    public void updateDueDate(int activeTaskId, String dueDateStr, int frequencyDays) {
        try {
            Date dueDate = dateFormat.parse(dueDateStr);
            if (dueDate != null) {
                Calendar cal = Calendar.getInstance();
                cal.setTime(dueDate);
                cal.add(Calendar.DAY_OF_MONTH, -frequencyDays);
                String lastDoneDate = dateFormat.format(cal.getTime());
                updateLastDoneDate(activeTaskId, lastDoneDate);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateTask(int catalogTaskId, String newName, int newFrequencyDays) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.beginTransaction();
        try {
            ContentValues catalogCv = new ContentValues();
            catalogCv.put("name", newName);
            catalogCv.put("default_frequency_days", newFrequencyDays);
            db.update("task_catalog", catalogCv, "id = ?", new String[]{String.valueOf(catalogTaskId)});

            ContentValues activeCv = new ContentValues();
            activeCv.put("frequency_days", newFrequencyDays);
            db.update("active_tasks", activeCv, "catalog_task_id = ?", new String[]{String.valueOf(catalogTaskId)});

            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    public void addCustomTask(String name, int defaultFrequencyDays) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("name", name);
        cv.put("is_custom", 1);
        cv.put("default_frequency_days", defaultFrequencyDays);
        db.insert("task_catalog", null, cv);
    }

    public List<ActiveTask> getTasksDueForNotification() {
        List<ActiveTask> tasks = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        
        String query = "SELECT a.id, a.catalog_task_id, c.name, a.frequency_days, a.last_done_date, " +
                "date(a.last_done_date, '+' || a.frequency_days || ' days') AS due_date, " +
                "CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) AS days_overdue " +
                "FROM active_tasks a " +
                "JOIN task_catalog c ON a.catalog_task_id = c.id " +
                "WHERE a.notified_this_cycle = 0 " +
                "AND (a.last_done_date IS NULL OR CAST(julianday('now', 'localtime') - julianday(date(a.last_done_date, '+' || a.frequency_days || ' days')) AS INTEGER) >= 0)";
                
        try (Cursor cursor = db.rawQuery(query, null)) {
            if (cursor.moveToFirst()) {
                do {
                    ActiveTask task = mapActiveTask(cursor);
                    tasks.add(task);
                } while (cursor.moveToNext());
            }
        }
        return tasks;
    }

    public void markNotified(List<Integer> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) return;
        
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put("notified_this_cycle", 1);
        
        List<String> idStrings = new ArrayList<>();
        for (Integer id : taskIds) {
            idStrings.add(String.valueOf(id));
        }
        
        String inClause = TextUtils.join(",", idStrings);
        db.update("active_tasks", cv, "id IN (" + inClause + ")", null);
    }

    public void importTask(String name, int frequencyDays, String lastDoneDate) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.beginTransaction();
        try {
            int catalogTaskId = -1;
            
            // Find in catalog
            try (Cursor c = db.query("task_catalog", new String[]{"id"}, "name = ?", new String[]{name}, null, null, null)) {
                if (c.moveToFirst()) {
                    catalogTaskId = c.getInt(0);
                }
            }
            
            // Create in catalog if not found
            if (catalogTaskId == -1) {
                ContentValues cv = new ContentValues();
                cv.put("name", name);
                cv.put("is_custom", 1);
                cv.put("default_frequency_days", frequencyDays);
                catalogTaskId = (int) db.insert("task_catalog", null, cv);
            }
            
            // Upsert in active_tasks
            int activeTaskId = -1;
            try (Cursor c = db.query("active_tasks", new String[]{"id"}, "catalog_task_id = ?", new String[]{String.valueOf(catalogTaskId)}, null, null, null)) {
                if (c.moveToFirst()) {
                    activeTaskId = c.getInt(0);
                }
            }
            
            ContentValues activeCv = new ContentValues();
            activeCv.put("catalog_task_id", catalogTaskId);
            activeCv.put("frequency_days", frequencyDays);
            if (lastDoneDate != null && !lastDoneDate.isEmpty()) {
                activeCv.put("last_done_date", lastDoneDate);
            }
            activeCv.put("notified_this_cycle", 0);
            
            if (activeTaskId == -1) {
                db.insert("active_tasks", null, activeCv);
            } else {
                db.update("active_tasks", activeCv, "id = ?", new String[]{String.valueOf(activeTaskId)});
            }
            
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    private ActiveTask mapActiveTask(Cursor cursor) {
        ActiveTask task = new ActiveTask();
        task.setId(cursor.getInt(cursor.getColumnIndexOrThrow("id")));
        task.setCatalogTaskId(cursor.getInt(cursor.getColumnIndexOrThrow("catalog_task_id")));
        task.setTaskName(cursor.getString(cursor.getColumnIndexOrThrow("name")));
        task.setFrequencyDays(cursor.getInt(cursor.getColumnIndexOrThrow("frequency_days")));
        
        int lastDoneIdx = cursor.getColumnIndexOrThrow("last_done_date");
        if (!cursor.isNull(lastDoneIdx)) {
            task.setLastDoneDate(cursor.getString(lastDoneIdx));
        }
        
        int dueDateIdx = cursor.getColumnIndexOrThrow("due_date");
        if (!cursor.isNull(dueDateIdx)) {
            task.setDueDate(cursor.getString(dueDateIdx));
        }
        
        int overdueIdx = cursor.getColumnIndexOrThrow("days_overdue");
        if (!cursor.isNull(overdueIdx)) {
            task.setDaysOverdue(cursor.getInt(overdueIdx));
        } else {
            // For NULL last_done_date, set daysOverdue = frequencyDays (treat as very overdue)
            task.setDaysOverdue(task.getFrequencyDays());
        }
        
        return task;
    }
}
