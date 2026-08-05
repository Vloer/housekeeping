package com.app.housekeeping.fragment;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;

import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.MainActivity;
import com.app.housekeeping.R;
import com.app.housekeeping.adapter.ActiveTaskAdapter;
import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.model.Frequency;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ActiveTasksFragment extends Fragment implements ActiveTaskAdapter.OnTaskActionListener {

    private RecyclerView recyclerView;
    private View emptyState;
    private ActiveTaskAdapter adapter;
    private TaskRepository repository;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_active_tasks, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        recyclerView = view.findViewById(R.id.recycler_active_tasks);
        emptyState = view.findViewById(R.id.empty_state);
        
        repository = TaskRepository.getInstance(requireContext());
        
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ActiveTaskAdapter(new ArrayList<>(), this);
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
                repository.getActiveTasksNetwork(hm.getHouseholdId(), new TaskRepository.RepositoryCallback<List<ActiveTask>>() {
                    @Override
                    public void onSuccess(List<ActiveTask> tasks) {
                        if (!isAdded()) return;
                        adapter.updateTasks(tasks);
                        updateTabCount(tasks.size());
                        if (tasks.isEmpty()) {
                            recyclerView.setVisibility(View.GONE);
                            emptyState.setVisibility(View.VISIBLE);
                        } else {
                            recyclerView.setVisibility(View.VISIBLE);
                            emptyState.setVisibility(View.GONE);
                        }
                    }

                    @Override
                    public void onError(String error) {
                        if (!isAdded()) return;
                        List<ActiveTask> tasks = repository.getActiveTasks();
                        adapter.updateTasks(tasks);
                        updateTabCount(tasks.size());
                    }
                });
            } else {
                List<ActiveTask> tasks = repository.getActiveTasks();
                adapter.updateTasks(tasks);
                updateTabCount(tasks.size());
                if (tasks.isEmpty()) {
                    recyclerView.setVisibility(View.GONE);
                    emptyState.setVisibility(View.VISIBLE);
                } else {
                    recyclerView.setVisibility(View.VISIBLE);
                    emptyState.setVisibility(View.GONE);
                }
            }
        }
    }

    private void updateTabCount(int count) {
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).updateToDoTabCount(count);
        }
    }

    @Override
    public void onTaskDone(ActiveTask task) {
        if (repository != null) {
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_YEAR, task.getFrequencyDays());
            String nextDueDateStr = dateFormat.format(cal.getTime());

            String uuid = HouseholdManager.getInstance(requireContext()).getUserUuid();
            repository.markDoneNetwork(task.getId(), uuid, result -> {
                if (isAdded()) {
                    Toast.makeText(requireContext(),
                            getString(R.string.task_completed_toast, task.getTaskName(), nextDueDateStr),
                            Toast.LENGTH_LONG).show();
                }
                refreshTasks();
                if (getActivity() instanceof MainActivity) {
                    ((MainActivity) getActivity()).refreshHighscores();
                }
            });
        }
    }

    @Override
    public void onEditLastDoneDate(ActiveTask task) {
        Calendar cal = Calendar.getInstance();
        if (task.getLastDoneDate() != null && !task.getLastDoneDate().isEmpty()) {
            try {
                Date date = dateFormat.parse(task.getLastDoneDate());
                if (date != null) cal.setTime(date);
            } catch (Exception ignored) {}
        }

        DatePickerDialog dialog = new DatePickerDialog(
                requireContext(),
                (view, year, month, dayOfMonth) -> {
                    Calendar selected = Calendar.getInstance();
                    selected.set(year, month, dayOfMonth);
                    String newDateStr = dateFormat.format(selected.getTime());
                    if (repository != null) {
                        repository.updateLastDoneDateNetwork(task.getId(), newDateStr, result -> refreshTasks());
                    }
                },
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH)
        );
        dialog.setTitle(getString(R.string.edit_last_done_date));
        dialog.show();
    }


    @Override
    public void onEditTask(ActiveTask task) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_task, null);
        EditText editTaskName = dialogView.findViewById(R.id.edit_task_name);
        Spinner spinnerFrequency = dialogView.findViewById(R.id.spinner_frequency);

        editTaskName.setText(task.getTaskName());

        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, Frequency.getLabels());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerFrequency.setAdapter(spinnerAdapter);

        Frequency[] frequencies = Frequency.values();
        for (int i = 0; i < frequencies.length; i++) {
            if (frequencies[i].days == task.getFrequencyDays()) {
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
                            repository.updateTaskNetwork(hm.getHouseholdId(), task.getCatalogTaskId(), updatedName, selectedFreq.days, result -> refreshTasks());
                        }
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    @Override
    public void onDeleteTask(ActiveTask task) {
        String[] options = new String[]{
                getString(R.string.edit_task),
                getString(R.string.delete_task_title)
        };

        new AlertDialog.Builder(requireContext())
                .setTitle(task.getTaskName())
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

    private void confirmDeleteTask(ActiveTask task) {
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.delete_task_title)
                .setMessage(getString(R.string.confirm_delete_task, task.getTaskName()))
                .setPositiveButton(R.string.delete, (dialog, which) -> {
                    HouseholdManager hm = HouseholdManager.getInstance(requireContext());
                    if (repository != null) {
                        repository.deleteTaskNetwork(hm.getHouseholdId(), task.getCatalogTaskId(), result -> {
                            if (getActivity() instanceof MainActivity) {
                                ((MainActivity) getActivity()).refreshFragments();
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
