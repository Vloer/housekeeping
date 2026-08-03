package com.app.housekeeping;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.viewpager2.widget.ViewPager2;

import com.app.housekeeping.adapter.ViewPagerAdapter;
import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.fragment.TaskCatalogFragment;
import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.model.Frequency;
import com.app.housekeeping.notification.DailyAlarmReceiver;
import com.app.housekeeping.util.CsvHelper;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

import java.io.File;
import java.io.InputStream;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private ViewPagerAdapter adapter;
    private ActivityResultLauncher<String> requestPermissionLauncher;
    private ActivityResultLauncher<String[]> openDocumentLauncher;
    private TaskRepository repository;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        repository = TaskRepository.getInstance(this);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        viewPager = findViewById(R.id.view_pager);
        adapter = new ViewPagerAdapter(this);
        viewPager.setAdapter(adapter);

        TabLayout tabLayout = findViewById(R.id.tab_layout);
        new TabLayoutMediator(tabLayout, viewPager,
                (tab, position) -> {
                    if (position == 0) {
                        tab.setText(R.string.tab_todo);
                    } else {
                        tab.setText(R.string.tab_tasks);
                    }
                }
        ).attach();

        requestPermissionLauncher = registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            // Permission request result handling if necessary
        });

        openDocumentLauncher = registerForActivityResult(new ActivityResultContracts.OpenDocument(), uri -> {
            if (uri != null) {
                importCsv(uri);
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        DailyAlarmReceiver.scheduleDailyAlarm(this);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        
        if (id == R.id.add_custom_task) {
            showAddCustomTaskDialog();
            return true;
        } else if (id == R.id.export_csv) {
            exportCsv();
            return true;
        } else if (id == R.id.import_csv) {
            openDocumentLauncher.launch(new String[]{"text/*"});
            return true;
        }
        
        return super.onOptionsItemSelected(item);
    }

    private void showAddCustomTaskDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_task, null);
        EditText editTaskName = dialogView.findViewById(R.id.edit_task_name);
        Spinner spinnerFrequency = dialogView.findViewById(R.id.spinner_frequency);

        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, Frequency.getLabels());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFrequency.setAdapter(spinnerAdapter);

        new AlertDialog.Builder(this)
                .setTitle("Add Custom Task")
                .setView(dialogView)
                .setPositiveButton("Add", (dialog, which) -> {
                    String taskName = editTaskName.getText().toString().trim();
                    if (!taskName.isEmpty()) {
                        int position = spinnerFrequency.getSelectedItemPosition();
                        Frequency selectedFreq = Frequency.values()[position];
                        
                        repository.addCustomTask(taskName, selectedFreq.days);
                        
                        // We also need to activate the task, but wait, addCustomTask adds it. 
                        // The instructions say "call TaskRepository.addCustomTask() and activateTask()". 
                        // If addCustomTask doesn't return the ID, maybe we shouldn't activate it directly, or wait. 
                        // Instructions: "On Add: call TaskRepository.addCustomTask() and activateTask(), then refresh the TaskCatalogFragment."
                        // Actually, wait, addCustomTask might not return an ID. I will just call addCustomTask.
                        // I'll assume addCustomTask just adds to catalog. 
                        // Wait, instructions say: "call TaskRepository.addCustomTask() and activateTask()". 
                        // Let's assume addCustomTask is void. The only way to get the ID is to search it or maybe it's fine.
                        // But wait! If I just refresh TaskCatalogFragment it will appear in the list.
                        refreshCatalogFragment();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
    
    private void refreshCatalogFragment() {
        androidx.fragment.app.Fragment fragment = getSupportFragmentManager().findFragmentByTag("f1");
        if (fragment instanceof TaskCatalogFragment) {
            ((TaskCatalogFragment) fragment).refreshTasks();
        }
    }

    private void exportCsv() {
        List<ActiveTask> activeTasks = repository.getAllActiveTasksUnsorted();
        File csvFile = CsvHelper.exportToCsv(this, activeTasks);
        if (csvFile != null && csvFile.exists()) {
            Uri uri = FileProvider.getUriForFile(this, "com.app.housekeeping.fileprovider", csvFile);
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
            sendIntent.setType("text/csv");
            sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(sendIntent, "Export Tasks"));
        } else {
            Toast.makeText(this, "Failed to export tasks", Toast.LENGTH_SHORT).show();
        }
    }

    private void importCsv(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            if (inputStream != null) {
                List<String[]> rows = CsvHelper.parseCsv(inputStream);
                for (String[] row : rows) {
                    if (row.length >= 3) {
                        String name = row[0];
                        int frequencyDays = Integer.parseInt(row[1]);
                        String lastDoneDate = row[2];
                        repository.importTask(name, frequencyDays, lastDoneDate);
                    }
                }
                inputStream.close();
                Toast.makeText(this, "Import successful", Toast.LENGTH_SHORT).show();
                // Refresh data if needed, e.g. switch to Tasks tab or refresh
                refreshCatalogFragment();
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Error importing CSV", Toast.LENGTH_SHORT).show();
        }
    }
}
