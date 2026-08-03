package com.app.housekeeping;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
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
import com.app.housekeeping.fragment.ActiveTasksFragment;
import com.app.housekeeping.fragment.TaskCatalogFragment;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.household.HouseholdOnboardingDialog;
import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.model.Frequency;
import com.app.housekeeping.notification.DailyAlarmReceiver;
import com.app.housekeeping.util.CsvHelper;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private ViewPagerAdapter adapter;
    private TabLayoutMediator tabLayoutMediator;
    private ActivityResultLauncher<String> requestPermissionLauncher;
    private ActivityResultLauncher<String[]> openDocumentLauncher;
    private TaskRepository repository;
    private boolean isOnboardingDialogShowing = false;

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
        setupTabs(tabLayout);

        requestPermissionLauncher = registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            // Permission request result handling
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

    public void updateToDoTabCount(int count) {
        TabLayout tabLayout = findViewById(R.id.tab_layout);
        if (tabLayout != null) {
            TabLayout.Tab tab = tabLayout.getTabAt(0);
            if (tab != null) {
                tab.setText(getString(R.string.tab_todo) + " (" + count + ")");
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateAppTitle();
        if (!HouseholdManager.getInstance(this).hasHousehold()) {
            checkHouseholdOnboarding();
        }
    }

    private void updateAppTitle() {
        HouseholdManager hm = HouseholdManager.getInstance(this);
        if (hm.hasHousehold()) {
            String name = hm.getHouseholdName();
            if (getSupportActionBar() != null) {
                getSupportActionBar().setTitle(getString(R.string.title_household_housekeeping, name));
            }
        } else {
            if (getSupportActionBar() != null) {
                getSupportActionBar().setTitle(R.string.app_name);
            }
        }
    }

    private void checkHouseholdOnboarding() {
        HouseholdManager hm = HouseholdManager.getInstance(this);
        if (!hm.hasHousehold() && !isOnboardingDialogShowing) {
            isOnboardingDialogShowing = true;
            HouseholdOnboardingDialog.show(this, new HouseholdOnboardingDialog.OnHouseholdSetupListener() {
                @Override
                public void onHouseholdSetupSuccess() {
                    isOnboardingDialogShowing = false;
                    updateAppTitle();
                    refreshFragments();
                }

                @Override
                public void onHouseholdSetupDismissed() {
                    isOnboardingDialogShowing = false;
                }
            });
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        
        if (id == R.id.select_household) {
            showSwitchHouseholdDialog();
            return true;
        } else if (id == R.id.household_info) {
            showHouseholdInfoDialog();
            return true;
        } else if (id == R.id.add_custom_task) {
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

    private void showSwitchHouseholdDialog() {
        HouseholdManager hm = HouseholdManager.getInstance(this);
        List<com.app.housekeeping.model.Household> households = hm.getJoinedHouseholds();
        
        if (households.isEmpty()) {
            checkHouseholdOnboarding();
            return;
        }

        String[] items = new String[households.size() + 1];
        int selectedIdx = -1;
        int activeId = hm.getHouseholdId();

        for (int i = 0; i < households.size(); i++) {
            com.app.housekeeping.model.Household h = households.get(i);
            items[i] = h.getName() + " (" + h.getJoinCode() + ")";
            if (h.getId() == activeId) {
                selectedIdx = i;
            }
        }
        items[households.size()] = getString(R.string.create_or_join_household);

        new AlertDialog.Builder(this)
                .setTitle(R.string.select_household)
                .setSingleChoiceItems(items, selectedIdx, (dialog, which) -> {
                    if (which == households.size()) {
                        dialog.dismiss();
                        checkHouseholdOnboarding();
                    } else {
                        com.app.housekeeping.model.Household selected = households.get(which);
                        hm.setCurrentHousehold(selected.getId());
                        updateAppTitle();
                        refreshFragments();
                        dialog.dismiss();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void showHouseholdInfoDialog() {
        HouseholdManager hm = HouseholdManager.getInstance(this);
        String message = getString(R.string.household_info_message, hm.getHouseholdName(), hm.getJoinCode());

        new AlertDialog.Builder(this)
                .setTitle(R.string.household_info)
                .setMessage(message)
                .setPositiveButton(R.string.copy_code, (dialog, which) -> {
                    ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData clip = ClipData.newPlainText(getString(R.string.join_code_label), hm.getJoinCode());
                    if (clipboard != null) {
                        clipboard.setPrimaryClip(clip);
                        Toast.makeText(this, R.string.code_copied_toast, Toast.LENGTH_SHORT).show();
                    }
                })
                .setNeutralButton(R.string.switch_household, (dialog, which) -> {
                    showSwitchHouseholdDialog();
                })
                .setNegativeButton(R.string.close, null)
                .show();
    }

    private void showAddCustomTaskDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_task, null);
        EditText editTaskName = dialogView.findViewById(R.id.edit_task_name);
        Spinner spinnerFrequency = dialogView.findViewById(R.id.spinner_frequency);

        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, Frequency.getLabels());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFrequency.setAdapter(spinnerAdapter);

        new AlertDialog.Builder(this)
                .setTitle(R.string.add_custom_task)
                .setView(dialogView)
                .setPositiveButton(R.string.add, (dialog, which) -> {
                    String taskName = editTaskName.getText().toString().trim();
                    if (!taskName.isEmpty()) {
                        int position = spinnerFrequency.getSelectedItemPosition();
                        Frequency selectedFreq = Frequency.values()[position];
                        
                        HouseholdManager hm = HouseholdManager.getInstance(this);
                        repository.addCustomTaskNetwork(hm.getHouseholdId(), taskName, selectedFreq.days, result -> refreshFragments());
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }
    
    private void setupTabs(TabLayout tabLayout) {
        if (tabLayoutMediator != null) {
            tabLayoutMediator.detach();
        }
        tabLayoutMediator = new TabLayoutMediator(tabLayout, viewPager,
                (tab, position) -> {
                    if (position == 0) {
                        tab.setText(R.string.tab_todo);
                    } else if (position == 1) {
                        tab.setText(R.string.tab_tasks);
                    } else if (position == 2) {
                        String hName = HouseholdManager.getInstance(this).getHouseholdName();
                        if (hName != null && !hName.isEmpty()) {
                            tab.setText(getString(R.string.household_highscore_title, hName));
                        } else {
                            tab.setText(R.string.household_highscore_default);
                        }
                    } else {
                        tab.setText(R.string.global_highscores_title);
                    }
                }
        );
        tabLayoutMediator.attach();
    }
    
    public void refreshFragments() {
        adapter.notifyDataSetChanged();
        TabLayout tabLayout = findViewById(R.id.tab_layout);
        if (tabLayout != null) {
            setupTabs(tabLayout);
        }
        for (androidx.fragment.app.Fragment fragment : getSupportFragmentManager().getFragments()) {
            if (fragment instanceof ActiveTasksFragment) {
                ((ActiveTasksFragment) fragment).refreshTasks();
            } else if (fragment instanceof TaskCatalogFragment) {
                ((TaskCatalogFragment) fragment).refreshTasks();
            } else if (fragment instanceof com.app.housekeeping.fragment.HighscoresFragment) {
                ((com.app.housekeeping.fragment.HighscoresFragment) fragment).refreshHighscores();
            }
        }
    }

    public void refreshHighscores() {
        for (androidx.fragment.app.Fragment fragment : getSupportFragmentManager().getFragments()) {
            if (fragment instanceof com.app.housekeeping.fragment.HighscoresFragment) {
                ((com.app.housekeeping.fragment.HighscoresFragment) fragment).refreshHighscores();
            }
        }
    }

    private void exportCsv() {
        HouseholdManager hm = HouseholdManager.getInstance(this);
        repository.getAllActiveTasksUnsortedNetwork(hm.getHouseholdId(), new TaskRepository.RepositoryCallback<List<ActiveTask>>() {
            @Override
            public void onSuccess(List<ActiveTask> activeTasks) {
                File csvFile = CsvHelper.exportToCsv(MainActivity.this, activeTasks);
                if (csvFile != null && csvFile.exists()) {
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, "com.app.housekeeping.fileprovider", csvFile);
                    Intent sendIntent = new Intent();
                    sendIntent.setAction(Intent.ACTION_SEND);
                    sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
                    sendIntent.setType("text/csv");
                    sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(sendIntent, getString(R.string.export_tasks)));
                } else {
                    Toast.makeText(MainActivity.this, R.string.export_failed, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String error) {
                Toast.makeText(MainActivity.this, getString(R.string.export_error, error), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void importCsv(Uri uri) {
        try (InputStream inputStream = getContentResolver().openInputStream(uri)) {
            if (inputStream != null) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                
                HouseholdManager hm = HouseholdManager.getInstance(this);
                repository.importCsvNetwork(hm.getHouseholdId(), sb.toString(), new TaskRepository.RepositoryCallback<Void>() {
                    @Override
                    public void onSuccess(Void result) {
                        Toast.makeText(MainActivity.this, R.string.import_success, Toast.LENGTH_SHORT).show();
                        refreshFragments();
                    }

                    @Override
                    public void onError(String error) {
                        Toast.makeText(MainActivity.this, getString(R.string.import_error, error), Toast.LENGTH_SHORT).show();
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, R.string.import_csv_error, Toast.LENGTH_SHORT).show();
        }
    }
}
