package com.app.housekeeping.model;

public class Household {
    private int id;
    private String name;
    private String joinCode;

    public Household(int id, String name, String joinCode) {
        this.id = id;
        this.name = name;
        this.joinCode = joinCode;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }
}
