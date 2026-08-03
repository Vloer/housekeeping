package com.app.housekeeping.model;

public class ActiveTask {
    private int id;
    private int catalogTaskId;
    private String taskName;
    private int frequencyDays;
    private String lastDoneDate;
    private String dueDate;
    private int daysOverdue;

    public ActiveTask() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getCatalogTaskId() { return catalogTaskId; }
    public void setCatalogTaskId(int catalogTaskId) { this.catalogTaskId = catalogTaskId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public int getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(int frequencyDays) { this.frequencyDays = frequencyDays; }

    public String getLastDoneDate() { return lastDoneDate; }
    public void setLastDoneDate(String lastDoneDate) { this.lastDoneDate = lastDoneDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public int getDaysOverdue() { return daysOverdue; }
    public void setDaysOverdue(int daysOverdue) { this.daysOverdue = daysOverdue; }
}
