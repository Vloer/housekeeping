package com.app.housekeeping.model;

public enum Frequency {
    WEEKLY("Every week", 7),
    BIWEEKLY("Every 2 weeks", 14),
    MONTHLY("Every month", 30),
    BIMONTHLY("Every 2 months", 60),
    QUARTERLY("Every quarter", 91),
    HALF_YEARLY("Every 6 months", 182),
    YEARLY("Every year", 365);

    public final String label;
    public final int days;

    Frequency(String label, int days) {
        this.label = label;
        this.days = days;
    }

    public static Frequency fromDays(int days) {
        for (Frequency f : values()) {
            if (f.days == days) return f;
        }
        return MONTHLY; // default fallback
    }

    public static String[] getLabels() {
        Frequency[] values = values();
        String[] labels = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            labels[i] = values[i].label;
        }
        return labels;
    }

    @Override
    public String toString() {
        return label;
    }
}
