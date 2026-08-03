package com.app.housekeeping.util;

import android.graphics.Color;

public class ColorUtil {

    private static final int GREEN = Color.parseColor("#4CAF50");
    private static final int LIGHT_GREEN = Color.parseColor("#8BC34A");
    private static final int ORANGE = Color.parseColor("#FF9800");
    private static final int DARK_RED = Color.parseColor("#B71C1C");

    public static int getUrgencyColor(int daysOverdue, int frequencyDays) {
        if (daysOverdue <= -2) {
            return GREEN;
        }
        if (daysOverdue == -1 || daysOverdue == 0) {
            return LIGHT_GREEN;
        }

        // Interpolate from ORANGE to DARK_RED
        float ratio = Math.min((float) daysOverdue / frequencyDays, 1.0f);
        
        int r1 = Color.red(ORANGE);
        int g1 = Color.green(ORANGE);
        int b1 = Color.blue(ORANGE);
        
        int r2 = Color.red(DARK_RED);
        int g2 = Color.green(DARK_RED);
        int b2 = Color.blue(DARK_RED);
        
        int r = (int) (r1 + (r2 - r1) * ratio);
        int g = (int) (g1 + (g2 - g1) * ratio);
        int b = (int) (b1 + (b2 - b1) * ratio);
        
        return Color.rgb(r, g, b);
    }
}
