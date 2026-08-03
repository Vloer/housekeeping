package com.app.housekeeping.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "housekeeping.db";
    private static final int DATABASE_VERSION = 1;

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE task_catalog (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "name TEXT NOT NULL UNIQUE, " +
                "is_custom INTEGER NOT NULL DEFAULT 0, " +
                "default_frequency_days INTEGER NOT NULL DEFAULT 30" +
                ");");

        db.execSQL("CREATE TABLE active_tasks (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "catalog_task_id INTEGER NOT NULL, " +
                "frequency_days INTEGER NOT NULL, " +
                "last_done_date TEXT, " +
                "notified_this_cycle INTEGER NOT NULL DEFAULT 0, " +
                "FOREIGN KEY (catalog_task_id) REFERENCES task_catalog(id)" +
                ");");

        seedTasks(db);
    }

    private void seedTasks(SQLiteDatabase db) {
        String[][] tasks = {
            {"gras maaien", "182"},
            {"bed verschonen", "14"},
            {"badkamer", "14"},
            {"wc beneden", "14"},
            {"keukenkastjes buitenkant", "30"},
            {"meubels/kastjes woonkamer", "14"},
            {"dweilen badkamer en wc", "30"},
            {"oven schoonmaken", "30"},
            {"koffiezetapparaat", "30"},
            {"douche cabine+ramen", "60"},
            {"dweilen boven+zolder", "60"},
            {"wasmachine schoonmaakprogr.+", "60"},
            {"van binnen schoonmaken", "60"},
            {"kattenbak volledig", "91"},
            {"slaapkamer opruimen +", "60"},
            {"poetsen", "60"},
            {"koelkast datum+poetsen", "91"},
            {"dweilen beneden", "91"},
            {"vakje wasmachine schoonmaken", "91"},
            {"klepje wasmachine legen", "91"},
            {"filter stofzuiger uitspoelen", "91"},
            {"ramen wassen buiten", "91"},
            {"ramen wassen binnen", "91"},
            {"Auto buitenkant 107", "91"},
            {"Auto binnenkant 107", "91"},
            {"auto buitenkant 3008", "91"},
            {"auto binnenkant 3008", "91"},
            {"vaatwasser filter en schoonmaakprogramma + aanvullen zout en glansspoelmiddel", "91"},
            {"filter badkamer", "182"},
            {"keukenkastjes binnenkant", "182"},
            {"binnenkant plankjes badkamer", "182"},
            {"Lamellen keukenraam", "182"},
            {"kookplaat schrobben", "182"},
            {"voorraadkast datum + poetsen", "182"},
            {"muren badkamer en wc", "365"},
            {"Deuren", "365"},
            {"Voegen badkamer en wc", "365"},
            {"afzuigkap + filters", "365"},
            {"bed Ted", "14"},
            {"onderhoud droger", "30"}
        };
        for (String[] task : tasks) {
            ContentValues cv = new ContentValues();
            cv.put("name", task[0]);
            cv.put("is_custom", 0);
            cv.put("default_frequency_days", Integer.parseInt(task[1]));
            db.insert("task_catalog", null, cv);
        }
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS active_tasks");
        db.execSQL("DROP TABLE IF EXISTS task_catalog");
        onCreate(db);
    }
}
