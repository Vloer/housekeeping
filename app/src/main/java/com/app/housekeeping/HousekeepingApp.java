package com.app.housekeeping;

import android.app.Application;
import com.app.housekeeping.util.ThemeManager;

public class HousekeepingApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        ThemeManager.applyTheme(this);
    }
}
