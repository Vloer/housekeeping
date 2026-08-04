package com.app.housekeeping.model;

public class CatalogTask {
    private int id;
    private String name;
    private boolean isCustom;
    private int defaultFrequencyDays;
    private boolean isActive;
    private int frequencyDays;
    private int activeTaskId;
    private String lastDoneDate;
    private String dueDate;

    public CatalogTask() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isCustom() { return isCustom; }
    public void setCustom(boolean custom) { isCustom = custom; }

    public int getDefaultFrequencyDays() { return defaultFrequencyDays; }
    public void setDefaultFrequencyDays(int defaultFrequencyDays) { this.defaultFrequencyDays = defaultFrequencyDays; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public int getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(int frequencyDays) { this.frequencyDays = frequencyDays; }

    public int getActiveTaskId() { return activeTaskId; }
    public void setActiveTaskId(int activeTaskId) { this.activeTaskId = activeTaskId; }

    public String getLastDoneDate() { return lastDoneDate; }
    public void setLastDoneDate(String lastDoneDate) { this.lastDoneDate = lastDoneDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
}
