package com.app.housekeeping.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.adapter.HighscoreAdapter;
import com.app.housekeeping.database.TaskRepository;
import com.app.housekeeping.model.HighscoreEntry;

import java.util.ArrayList;
import java.util.List;

public class HighscoresFragment extends Fragment {

    private static final String ARG_IS_GLOBAL = "is_global";
    private static final String ARG_HOUSEHOLD_ID = "household_id";

    private boolean isGlobal = false;
    private int householdId = -1;

    private RecyclerView recyclerView;
    private View emptyState;
    private HighscoreAdapter adapter;
    private TaskRepository repository;

    public static HighscoresFragment newInstanceForHousehold(int householdId) {
        HighscoresFragment fragment = new HighscoresFragment();
        Bundle args = new Bundle();
        args.putBoolean(ARG_IS_GLOBAL, false);
        args.putInt(ARG_HOUSEHOLD_ID, householdId);
        fragment.setArguments(args);
        return fragment;
    }

    public static HighscoresFragment newInstanceGlobal() {
        HighscoresFragment fragment = new HighscoresFragment();
        Bundle args = new Bundle();
        args.putBoolean(ARG_IS_GLOBAL, true);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            isGlobal = getArguments().getBoolean(ARG_IS_GLOBAL, false);
            householdId = getArguments().getInt(ARG_HOUSEHOLD_ID, -1);
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_highscores, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        recyclerView = view.findViewById(R.id.recycler_highscores);
        emptyState = view.findViewById(R.id.empty_state);

        repository = TaskRepository.getInstance(requireContext());

        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        HighscoreAdapter.OnUserClickListener clickListener = !isGlobal ? this::showUserTaskStatsDialog : null;
        adapter = new HighscoreAdapter(new ArrayList<>(), clickListener);
        recyclerView.setAdapter(adapter);
    }

    private void showUserTaskStatsDialog(HighscoreEntry entry) {
        if (!isAdded() || repository == null || householdId == -1) return;

        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_user_task_stats, null);
        RecyclerView recyclerViewStats = dialogView.findViewById(R.id.recycler_user_task_stats);
        View emptyText = dialogView.findViewById(R.id.text_empty_stats);

        recyclerViewStats.setLayoutManager(new LinearLayoutManager(requireContext()));

        String title = getString(R.string.user_task_stats_title, entry.getUsername());

        androidx.appcompat.app.AlertDialog dialog = new androidx.appcompat.app.AlertDialog.Builder(requireContext())
                .setTitle(title)
                .setView(dialogView)
                .setPositiveButton(R.string.close, null)
                .create();

        repository.getUserTaskStatsNetwork(householdId, entry.getUserUuid(), new TaskRepository.RepositoryCallback<List<com.app.housekeeping.model.UserTaskStat>>() {
            @Override
            public void onSuccess(List<com.app.housekeeping.model.UserTaskStat> stats) {
                if (!isAdded()) return;
                if (stats.isEmpty()) {
                    recyclerViewStats.setVisibility(View.GONE);
                    emptyText.setVisibility(View.VISIBLE);
                } else {
                    recyclerViewStats.setVisibility(View.VISIBLE);
                    emptyText.setVisibility(View.GONE);
                    recyclerViewStats.setAdapter(new com.app.housekeeping.adapter.UserTaskStatAdapter(stats));
                }
            }

            @Override
            public void onError(String error) {
                if (!isAdded()) return;
                recyclerViewStats.setVisibility(View.GONE);
                emptyText.setVisibility(View.VISIBLE);
            }
        });

        dialog.show();
    }

    @Override
    public void onResume() {
        super.onResume();
        refreshHighscores();
    }

    public void refreshHighscores() {
        if (repository != null && adapter != null && isAdded()) {
            if (isGlobal) {
                repository.getGlobalHighscoresNetwork(new TaskRepository.RepositoryCallback<List<HighscoreEntry>>() {
                    @Override
                    public void onSuccess(List<HighscoreEntry> entries) {
                        if (!isAdded()) return;
                        adapter.updateEntries(entries);
                        updateVisibility(entries);
                    }

                    @Override
                    public void onError(String error) {
                        if (!isAdded()) return;
                        updateVisibility(new ArrayList<>());
                    }
                });
            } else if (householdId != -1) {
                repository.getHouseholdHighscoresNetwork(householdId, new TaskRepository.RepositoryCallback<List<HighscoreEntry>>() {
                    @Override
                    public void onSuccess(List<HighscoreEntry> entries) {
                        if (!isAdded()) return;
                        adapter.updateEntries(entries);
                        updateVisibility(entries);
                    }

                    @Override
                    public void onError(String error) {
                        if (!isAdded()) return;
                        updateVisibility(new ArrayList<>());
                    }
                });
            }
        }
    }

    private void updateVisibility(List<HighscoreEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            recyclerView.setVisibility(View.GONE);
            emptyState.setVisibility(View.VISIBLE);
        } else {
            recyclerView.setVisibility(View.VISIBLE);
            emptyState.setVisibility(View.GONE);
        }
    }
}
