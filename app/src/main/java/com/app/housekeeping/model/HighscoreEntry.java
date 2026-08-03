package com.app.housekeeping.model;

public class HighscoreEntry {
    private int rank;
    private String userUuid;
    private String username;
    private int points;

    public HighscoreEntry(int rank, String userUuid, String username, int points) {
        this.rank = rank;
        this.userUuid = userUuid;
        this.username = username;
        this.points = points;
    }

    public int getRank() {
        return rank;
    }

    public String getUserUuid() {
        return userUuid;
    }

    public String getUsername() {
        return username;
    }

    public int getPoints() {
        return points;
    }
}
