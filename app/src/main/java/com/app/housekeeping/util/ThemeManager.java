package com.app.housekeeping.util;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.appcompat.app.AppCompatDelegate;

public class ThemeManager {

    private static final String PREF_NAME = "theme_prefs";
    private static final String KEY_NIGHT_MODE = "night_mode";

    public static void applyTheme(Context context) {
        int mode = getSavedThemeMode(context);
        AppCompatDelegate.setDefaultNightMode(mode);
    }

    public static int getSavedThemeMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getInt(KEY_NIGHT_MODE, AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
    }

    public static void setThemeMode(Context context, int mode) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putInt(KEY_NIGHT_MODE, mode).apply();
        AppCompatDelegate.setDefaultNightMode(mode);
    }

    public static boolean isDarkMode(Context context) {
        int mode = getSavedThemeMode(context);
        if (mode == AppCompatDelegate.MODE_NIGHT_YES) {
            return true;
        } else if (mode == AppCompatDelegate.MODE_NIGHT_NO) {
            return false;
        } else {
            int currentNightMode = context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
            return currentNightMode == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }
    }
}
