package com.app.housekeeping.util;

import android.content.Context;

import com.app.housekeeping.model.ActiveTask;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

public class CsvHelper {

    public static File exportToCsv(Context context, List<ActiveTask> tasks) {
        File file = new File(context.getCacheDir(), "housekeeping_export.csv");
        try (FileOutputStream fos = new FileOutputStream(file);
             OutputStreamWriter writer = new OutputStreamWriter(fos)) {
             
            writer.write("task_name,frequency_days,last_done_date\n");
            
            for (ActiveTask task : tasks) {
                String name = task.getTaskName();
                if (name != null && name.contains(",")) {
                    name = "\"" + name.replace("\"", "\"\"") + "\"";
                }
                
                String lastDone = task.getLastDoneDate() != null ? task.getLastDoneDate() : "";
                writer.write(String.format("%s,%d,%s\n", name, task.getFrequencyDays(), lastDone));
            }
            
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
        return file;
    }

    public static List<String[]> parseCsv(InputStream inputStream) {
        List<String[]> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            boolean firstRow = true;
            
            while ((line = reader.readLine()) != null) {
                if (firstRow) {
                    firstRow = false;
                    continue;
                }
                
                String[] fields = parseCsvLine(line);
                if (fields.length >= 3) {
                    rows.add(new String[]{fields[0], fields[1], fields[2]});
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return rows;
    }

    private static String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        
        while (result.size() < 3) {
            result.add("");
        }
        
        return result.toArray(new String[0]);
    }
}
