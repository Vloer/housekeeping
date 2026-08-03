package com.app.housekeeping.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.text.TextUtils;

import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.model.CatalogTask;
import com.app.housekeeping.model.HighscoreEntry;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.network.ApiClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TaskRepository {

    @FunctionalInterface
    public interface RepositoryCallback<T> {
        void onSuccess(T result);
        default void onError(String error) {}
    }

    private static TaskRepository instance;
    private final DatabaseHelper dbHelper;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.US);

    private TaskRepository(Context context) {
        dbHelper = new DatabaseHelper(context.getApplicationContext());
    }

    public static synchronized TaskRepository getInstance(Context context) {
        if (instance == null) {
            instance = new TaskRepository(context);
        }
        return instance;
    }

    // --- Network API Methods ---

    public void getCatalogTasksNetwork(int householdId, RepositoryCallback<List<CatalogTask>> callback) {
        ApiClient.getArray("/households/" + householdId + "/catalog", new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray result) {
                List<CatalogTask> tasks = new ArrayList<>();
                try {
                    for (int i = 0; i < result.length(); i++) {
                        JSONObject obj = result.getJSONObject(i);
                        CatalogTask task = new CatalogTask();
                        task.setId(obj.getInt("id"));
                        task.setName(obj.getString("name"));
                        task.setCustom(obj.getBoolean("is_custom"));
                        task.setDefaultFrequencyDays(obj.getInt("default_frequency_days"));
                        task.setActive(obj.getBoolean("is_active"));
                        task.setFrequencyDays(obj.getInt("frequency_days"));
                        tasks.add(task);
                    }
                    callback.onSuccess(tasks);
                } catch (Exception e) {
                    callback.onError("Parsing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Fallback to local
                callback.onSuccess(getAllCatalogTasks());
            }
        });
    }

    public void getActiveTasksNetwork(int householdId, RepositoryCallback<List<ActiveTask>> callback) {
        ApiClient.getArray("/households/" + householdId + "/active", new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray result) {
                List<ActiveTask> tasks = new ArrayList<>();
                try {
                    for (int i = 0; i < result.length(); i++) {
                        JSONObject obj = result.getJSONObject(i);
                        ActiveTask task = new ActiveTask();
                        task.setId(obj.getInt("id"));
                        task.setCatalogTaskId(obj.getInt("catalog_task_id"));
                        task.setTaskName(obj.getString("task_name"));
                        task.setFrequencyDays(obj.getInt("frequency_days"));
                        if (!obj.isNull("last_done_date")) {
                            task.setLastDoneDate(obj.getString("last_done_date"));
                        }
                        if (!obj.isNull("due_date")) {
                            task.setDueDate(obj.getString("due_date"));
                        }
                        task.setDaysOverdue(obj.getInt("days_overdue"));
                        tasks.add(task);
                    }
                    callback.onSuccess(tasks);
                } catch (Exception e) {
                    callback.onError("Parsing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Fallback to local
                callback.onSuccess(getActiveTasks());
            }
        });
    }

    public void getAllActiveTasksUnsortedNetwork(int householdId, RepositoryCallback<List<ActiveTask>> callback) {
        ApiClient.getArray("/households/" + householdId + "/active/all", new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray result) {
                List<ActiveTask> tasks = new ArrayList<>();
                try {
                    for (int i = 0; i < result.length(); i++) {
                        JSONObject obj = result.getJSONObject(i);
                        ActiveTask task = new ActiveTask();
                        task.setId(obj.getInt("id"));
                        task.setCatalogTaskId(obj.getInt("catalog_task_id"));
                        task.setTaskName(obj.getString("task_name"));
                        task.setFrequencyDays(obj.getInt("frequency_days"));
                        if (!obj.isNull("last_done_date")) {
                            task.setLastDoneDate(obj.getString("last_done_date"));
                        }
                        if (!obj.isNull("due_date")) {
                            task.setDueDate(obj.getString("due_date"));
                        }
                        task.setDaysOverdue(obj.getInt("days_overdue"));
                        tasks.add(task);
                    }
                    callback.onSuccess(tasks);
                } catch (Exception e) {
                    callback.onError("Parsing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage) {
                callback.onSuccess(getAllActiveTasksUnsorted());
            }
        });
    }

    public void activateTaskNetwork(int householdId, int catalogTaskId, int frequencyDays, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("catalog_task_id", catalogTaskId);
            body.put("frequency_days", frequencyDays);
            ApiClient.post("/households/" + householdId + "/activate", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    // Sync local SQLite
                    activateTask(catalogTaskId, frequencyDays);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    activateTask(catalogTaskId, frequencyDays);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            activateTask(catalogTaskId, frequencyDays);
            callback.onSuccess(null);
        }
    }

    public void deactivateTaskNetwork(int householdId, int catalogTaskId, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("catalog_task_id", catalogTaskId);
            ApiClient.post("/households/" + householdId + "/deactivate", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    deactivateTask(catalogTaskId);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    deactivateTask(catalogTaskId);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            deactivateTask(catalogTaskId);
            callback.onSuccess(null);
        }
    }

    public void markDoneNetwork(int activeTaskId, String userUuid, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            if (userUuid != null && !userUuid.isEmpty()) {
                body.put("user_uuid", userUuid);
            }
            ApiClient.post("/active-tasks/" + activeTaskId + "/mark-done", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    markDone(activeTaskId);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    markDone(activeTaskId);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            markDone(activeTaskId);
            callback.onSuccess(null);
        }
    }

    public void markDoneNetwork(int activeTaskId, RepositoryCallback<Void> callback) {
        markDoneNetwork(activeTaskId, "", callback);
    }

    public void getHouseholdHighscoresNetwork(int householdId, RepositoryCallback<List<HighscoreEntry>> callback) {
        ApiClient.getArray("/highscores/household/" + householdId, new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray result) {
                List<HighscoreEntry> list = new ArrayList<>();
                try {
                    for (int i = 0; i < result.length(); i++) {
                        JSONObject obj = result.getJSONObject(i);
                        int rank = obj.getInt("rank");
                        String uuid = obj.getString("user_uuid");
                        String name = obj.getString("username");
                        int pts = obj.getInt("points");
                        list.add(new HighscoreEntry(rank, uuid, name, pts));
                    }
                    callback.onSuccess(list);
                } catch (Exception e) {
                    callback.onError("Parsing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage) {
                callback.onError(errorMessage);
            }
        });
    }

    public void getGlobalHighscoresNetwork(RepositoryCallback<List<HighscoreEntry>> callback) {
        ApiClient.getArray("/highscores/global", new ApiClient.ApiCallback<JSONArray>() {
            @Override
            public void onSuccess(JSONArray result) {
                List<HighscoreEntry> list = new ArrayList<>();
                try {
                    for (int i = 0; i < result.length(); i++) {
                        JSONObject obj = result.getJSONObject(i);
                        int rank = obj.getInt("rank");
                        String uuid = obj.getString("user_uuid");
                        String name = obj.getString("username");
                        int pts = obj.getInt("points");
                        list.add(new HighscoreEntry(rank, uuid, name, pts));
                    }
                    callback.onSuccess(list);
                } catch (Exception e) {
                    callback.onError("Parsing error: " + e.getMessage());
                }
            }

            @Override
            public void onError(String errorMessage) {
                callback.onError(errorMessage);
            }
        });
    }

    public void updateLastDoneDateNetwork(int activeTaskId, String lastDoneDate, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("last_done_date", lastDoneDate);
            ApiClient.post("/active-tasks/" + activeTaskId + "/update-last-done", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    updateLastDoneDate(activeTaskId, lastDoneDate);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    updateLastDoneDate(activeTaskId, lastDoneDate);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            updateLastDoneDate(activeTaskId, lastDoneDate);
            callback.onSuccess(null);
        }
    }

    public void updateDueDateNetwork(int activeTaskId, String dueDateStr, int frequencyDays, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("due_date", dueDateStr);
            body.put("frequency_days", frequencyDays);
            ApiClient.post("/active-tasks/" + activeTaskId + "/update-due-date", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    updateDueDate(activeTaskId, dueDateStr, frequencyDays);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    updateDueDate(activeTaskId, dueDateStr, frequencyDays);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            updateDueDate(activeTaskId, dueDateStr, frequencyDays);
            callback.onSuccess(null);
        }
    }

    public void addCustomTaskNetwork(int householdId, String name, int defaultFrequencyDays, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("name", name);
            body.put("default_frequency_days", defaultFrequencyDays);
            ApiClient.post("/households/" + householdId + "/custom-task", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    addCustomTask(name, defaultFrequencyDays);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    addCustomTask(name, defaultFrequencyDays);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            addCustomTask(name, defaultFrequencyDays);
            callback.onSuccess(null);
        }
    }

    public void updateTaskNetwork(int householdId, int catalogTaskId, String newName, int newFrequencyDays, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("catalog_task_id", catalogTaskId);
            body.put("name", newName);
            body.put("frequency_days", newFrequencyDays);
            ApiClient.post("/households/" + householdId + "/update-task", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    updateTask(catalogTaskId, newName, newFrequencyDays);
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    updateTask(catalogTaskId, newName, newFrequencyDays);
                    callback.onSuccess(null);
                }
            });
        } catch (Exception e) {
            updateTask(catalogTaskId, newName, newFrequencyDays);
            callback.onSuccess(null);
        }
    }

    public void importCsvNetwork(int householdId, String csvContent, RepositoryCallback<Void> callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("csv_content", csvContent);
            ApiClient.post("/households/" + householdId + "/import-csv", body, new ApiClient.ApiCallback<JSONObject>() {
                @Override
                public void onSuccess(JSONObject result) {
                    callback.onSuccess(null);
                }

                @Override
                public void onError(String errorMessage) {
                    callback.onError(errorMessage);
                }
            });
        } catch (Exception e) {
            callback.onError(e.getMessage());
        }
    }

    // --- Local SQLite Synchronous Fallbacks ---

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
                "ORDER BY a.frequency_days ASC, days_overdue DESC";
                
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
        cv.put("last_done_date", LocalDate.now().format(DATE_FORMATTER));
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
            LocalDate dueDate = LocalDate.parse(dueDateStr, DATE_FORMATTER);
            LocalDate lastDoneDate = dueDate.minusDays(frequencyDays);
            updateLastDoneDate(activeTaskId, lastDoneDate.format(DATE_FORMATTER));
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
        
        StringBuilder whereClause = new StringBuilder("id IN (");
        String[] whereArgs = new String[taskIds.size()];
        for (int i = 0; i < taskIds.size(); i++) {
            if (i > 0) {
                whereClause.append(",");
            }
            whereClause.append("?");
            whereArgs[i] = String.valueOf(taskIds.get(i));
        }
        whereClause.append(")");
        
        db.update("active_tasks", cv, whereClause.toString(), whereArgs);
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
            task.setDaysOverdue(task.getFrequencyDays());
        }
        
        return task;
    }
}
