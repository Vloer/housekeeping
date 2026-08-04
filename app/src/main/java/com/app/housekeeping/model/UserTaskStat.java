package com.app.housekeeping.model;

public class UserTaskStat {
    private String taskName;
    private int completionsCount;
    private int totalPoints;

    public UserTaskStat() {}

    public UserTaskStat(String taskName, int completionsCount, int totalPoints) {
        this.taskName = taskName;
        this.completionsCount = completionsCount;
        this.totalPoints = totalPoints;
    }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public int getCompletionsCount() { return completionsCount; }
    public void setCompletionsCount(int completionsCount) { this.completionsCount = completionsCount; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
}
