package com.app.housekeeping.household;

import android.content.Context;
import android.content.SharedPreferences;

import com.app.housekeeping.model.Household;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class HouseholdManager {

    private static final String PREF_NAME = "housekeeping_prefs";
    private static final String KEY_CURRENT_HOUSEHOLD_ID = "current_household_id";
    private static final String KEY_HOUSEHOLDS_JSON = "joined_households_json";

    private static HouseholdManager instance;
    private final SharedPreferences prefs;

    private HouseholdManager(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized HouseholdManager getInstance(Context context) {
        if (instance == null) {
            instance = new HouseholdManager(context);
        }
        return instance;
    }

    public boolean hasHousehold() {
        return getHouseholdId() != -1;
    }

    public int getHouseholdId() {
        int currentId = prefs.getInt(KEY_CURRENT_HOUSEHOLD_ID, -1);
        if (currentId != -1) {
            return currentId;
        }
        List<Household> joined = getJoinedHouseholds();
        if (!joined.isEmpty()) {
            int firstId = joined.get(0).getId();
            setCurrentHousehold(firstId);
            return firstId;
        }
        int legacyId = prefs.getInt("household_id", -1);
        if (legacyId != -1) {
            String name = prefs.getString("household_name", "Household");
            String code = prefs.getString("join_code", "");
            addHousehold(legacyId, name, code);
            return legacyId;
        }
        return -1;
    }

    public String getHouseholdName() {
        Household current = getCurrentHousehold();
        return current != null ? current.getName() : "";
    }

    public String getJoinCode() {
        Household current = getCurrentHousehold();
        return current != null ? current.getJoinCode() : "";
    }

    public Household getCurrentHousehold() {
        int currentId = getHouseholdId();
        if (currentId == -1) return null;
        for (Household h : getJoinedHouseholds()) {
            if (h.getId() == currentId) {
                return h;
            }
        }
        return null;
    }

    public List<Household> getJoinedHouseholds() {
        List<Household> list = new ArrayList<>();
        String jsonStr = prefs.getString(KEY_HOUSEHOLDS_JSON, "");
        if (!jsonStr.isEmpty()) {
            try {
                JSONArray array = new JSONArray(jsonStr);
                for (int i = 0; i < array.length(); i++) {
                    JSONObject obj = array.getJSONObject(i);
                    int id = obj.getInt("id");
                    String name = obj.getString("name");
                    String code = obj.getString("joinCode");
                    list.add(new Household(id, name, code));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return list;
    }

    public void addHousehold(int householdId, String householdName, String joinCode) {
        List<Household> list = getJoinedHouseholds();
        boolean exists = false;
        for (Household h : list) {
            if (h.getId() == householdId) {
                h.setName(householdName);
                h.setJoinCode(joinCode);
                exists = true;
                break;
            }
        }
        if (!exists) {
            list.add(new Household(householdId, householdName, joinCode));
        }

        saveHouseholdsList(list);
        setCurrentHousehold(householdId);
    }

    public void setCurrentHousehold(int householdId) {
        prefs.edit().putInt(KEY_CURRENT_HOUSEHOLD_ID, householdId).apply();
    }

    private void saveHouseholdsList(List<Household> list) {
        try {
            JSONArray array = new JSONArray();
            for (Household h : list) {
                JSONObject obj = new JSONObject();
                obj.put("id", h.getId());
                obj.put("name", h.getName());
                obj.put("joinCode", h.getJoinCode());
                array.put(obj);
            }
            prefs.edit().putString(KEY_HOUSEHOLDS_JSON, array.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void removeHousehold(int householdId) {
        List<Household> list = getJoinedHouseholds();
        Household toRemove = null;
        for (Household h : list) {
            if (h.getId() == householdId) {
                toRemove = h;
                break;
            }
        }
        if (toRemove != null) {
            list.remove(toRemove);
            saveHouseholdsList(list);
        }

        if (getHouseholdId() == householdId) {
            if (!list.isEmpty()) {
                setCurrentHousehold(list.get(0).getId());
            } else {
                prefs.edit().remove(KEY_CURRENT_HOUSEHOLD_ID).apply();
            }
        }
    }

    public void clearAll() {
        prefs.edit().clear().apply();
    }
}
