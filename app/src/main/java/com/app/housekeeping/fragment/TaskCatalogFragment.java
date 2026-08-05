package com.app.housekeeping.fragment;

import android.content.DialogInterface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.adapter.TaskCatalogAdapter;
import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.model.CatalogTask;
import com.app.housekeeping.model.Frequency;

import java.util.ArrayList;
import java.util.List;

public class TaskCatalogFragment extends Fragment implements TaskCatalogAdapter.OnTaskToggleListener {

    private RecyclerView recyclerView;
    private TaskCatalogAdapter adapter;
    private TaskRepository repository;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_task_catalog, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        recyclerView = view.findViewById(R.id.recycler_catalog);
        repository = TaskRepository.getInstance(requireContext());
        
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new TaskCatalogAdapter(new ArrayList<>(), this);
        recyclerView.setAdapter(adapter);
    }

    @Override
    public void onResume() {
        super.onResume();
        refreshTasks();
    }
    
    public void refreshTasks() {
        if (repository != null && adapter != null && isAdded()) {
            HouseholdManager hm = HouseholdManager.getInstance(requireContext());
            if (hm.hasHousehold()) {
                repository.getCatalogTasksNetwork(hm.getHouseholdId(), new TaskRepository.RepositoryCallback<List<CatalogTask>>() {
                    @Override
                    public void onSuccess(List<CatalogTask> tasks) {
                        if (!isAdded()) return;
                        adapter.updateTasks(tasks);
                    }

                    @Override
                    public void onError(String error) {
                        if (!isAdded()) return;
                        List<CatalogTask> tasks = repository.getAllCatalogTasks();
                        adapter.updateTasks(tasks);
                    }
                });
            } else {
                List<CatalogTask> tasks = repository.getAllCatalogTasks();
                adapter.updateTasks(tasks);
            }
        }
    }

    @Override
    public void onTaskActivated(CatalogTask task) {
        String[] labels = Frequency.getLabels();
        Frequency[] frequencies = Frequency.values();
        
        int checkedItem = 0;
        for (int i = 0; i < frequencies.length; i++) {
            if (frequencies[i].days == task.getDefaultFrequencyDays()) {
                checkedItem = i;
                break;
            }
        }
        
        final int[] selectedIndex = {checkedItem};

        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.select_frequency)
                .setSingleChoiceItems(labels, checkedItem, (dialog, which) -> selectedIndex[0] = which)
                .setPositiveButton(R.string.activate, (dialog, which) -> {
                    Frequency selectedFreq = frequencies[selectedIndex[0]];
                    HouseholdManager hm = HouseholdManager.getInstance(requireContext());
                    repository.activateTaskNetwork(hm.getHouseholdId(), task.getId(), selectedFreq.days, result -> refreshTasks());
                })
                .setNegativeButton(R.string.cancel, (dialog, which) -> {
                    refreshTasks();
                })
                .setOnCancelListener(dialog -> refreshTasks())
                .show();
    }

    @Override
    public void onTaskDeactivated(CatalogTask task) {
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.deactivate_task_title)
                .setMessage(getString(R.string.confirm_deactivate_name, task.getName()))
                .setPositiveButton(R.string.deactivate, (dialog, which) -> {
                    HouseholdManager hm = HouseholdManager.getInstance(requireContext());
                    repository.deactivateTaskNetwork(hm.getHouseholdId(), task.getId(), result -> refreshTasks());
                })
                .setNegativeButton(R.string.cancel, (dialog, which) -> {
                    refreshTasks();
                })
                .setOnCancelListener(dialog -> refreshTasks())
                .show();
    }

    @Override
    public void onEditTask(CatalogTask task) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_task, null);
        EditText editTaskName = dialogView.findViewById(R.id.edit_task_name);
        Spinner spinnerFrequency = dialogView.findViewById(R.id.spinner_frequency);

        editTaskName.setText(task.getName());

        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, Frequency.getLabels());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFrequency.setAdapter(spinnerAdapter);

        Frequency[] frequencies = Frequency.values();
        int activeDays = task.isActive() ? task.getFrequencyDays() : task.getDefaultFrequencyDays();
        for (int i = 0; i < frequencies.length; i++) {
            if (frequencies[i].days == activeDays) {
                spinnerFrequency.setSelection(i);
                break;
            }
        }

        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.edit_task)
                .setView(dialogView)
                .setPositiveButton(R.string.save, (dialog, which) -> {
                    String updatedName = editTaskName.getText().toString().trim();
                    if (!updatedName.isEmpty()) {
                        int pos = spinnerFrequency.getSelectedItemPosition();
                        Frequency selectedFreq = frequencies[pos];
                        if (repository != null) {
                            HouseholdManager hm = HouseholdManager.getInstance(requireContext());
                            repository.updateTaskNetwork(hm.getHouseholdId(), task.getId(), updatedName, selectedFreq.days, result -> refreshTasks());
                        }
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    @Override
    public void onEditLastDoneDate(CatalogTask task) {
        if (!task.isActive() || task.getActiveTaskId() <= 0) return;

        java.text.SimpleDateFormat dateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US);
        java.util.Calendar cal = java.util.Calendar.getInstance();
        if (task.getLastDoneDate() != null && !task.getLastDoneDate().isEmpty()) {
            try {
                java.util.Date date = dateFormat.parse(task.getLastDoneDate());
                if (date != null) cal.setTime(date);
            } catch (Exception ignored) {}
        }

        android.app.DatePickerDialog dialog = new android.app.DatePickerDialog(
                requireContext(),
                (view, year, month, dayOfMonth) -> {
                    java.util.Calendar selected = java.util.Calendar.getInstance();
                    selected.set(year, month, dayOfMonth);
                    String newDateStr = dateFormat.format(selected.getTime());
                    if (repository != null) {
                        repository.updateLastDoneDateNetwork(task.getActiveTaskId(), newDateStr, result -> refreshTasks());
                    }
                },
                cal.get(java.util.Calendar.YEAR),
                cal.get(java.util.Calendar.MONTH),
                cal.get(java.util.Calendar.DAY_OF_MONTH)
        );
        dialog.setTitle(getString(R.string.edit_last_done_date));
        dialog.show();
    }

    @Override
    public void onDeleteTask(CatalogTask task) {
        String[] options = new String[]{
                getString(R.string.edit_task),
                getString(R.string.delete_task_title)
        };

        new AlertDialog.Builder(requireContext())
                .setTitle(task.getName())
                .setItems(options, (dialog, which) -> {
                    if (which == 0) {
                        onEditTask(task);
                    } else if (which == 1) {
                        confirmDeleteTask(task);
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void confirmDeleteTask(CatalogTask task) {
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.delete_task_title)
                .setMessage(getString(R.string.confirm_delete_task, task.getName()))
                .setPositiveButton(R.string.delete, (dialog, which) -> {
                    HouseholdManager hm = HouseholdManager.getInstance(requireContext());
                    if (repository != null) {
                        repository.deleteTaskNetwork(hm.getHouseholdId(), task.getId(), result -> {
                            if (getActivity() instanceof com.app.housekeeping.MainActivity) {
                                ((com.app.housekeeping.MainActivity) getActivity()).refreshFragments();
                            } else {
                                refreshTasks();
                            }
                        });
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }
}
