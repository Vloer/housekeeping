package com.app.housekeeping.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.TextView;
import androidx.appcompat.widget.SwitchCompat;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.model.CatalogTask;
import com.app.housekeeping.model.Frequency;

import java.util.ArrayList;
import java.util.List;

public class TaskCatalogAdapter extends RecyclerView.Adapter<TaskCatalogAdapter.ViewHolder> {

    private final List<CatalogTask> tasks = new ArrayList<>();
    private final OnTaskToggleListener listener;

    public interface OnTaskToggleListener {
        void onTaskActivated(CatalogTask task);
        void onTaskDeactivated(CatalogTask task);
        void onEditTask(CatalogTask task);
        void onEditLastDoneDate(CatalogTask task);
        void onDeleteTask(CatalogTask task);
    }

    public TaskCatalogAdapter(List<CatalogTask> initialTasks, OnTaskToggleListener listener) {
        if (initialTasks != null) {
            this.tasks.addAll(initialTasks);
        }
        this.listener = listener;
    }

    public void updateTasks(List<CatalogTask> newTasks) {
        tasks.clear();
        if (newTasks != null) {
            tasks.addAll(newTasks);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_catalog_task, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        CatalogTask task = tasks.get(position);
        
        holder.textTaskName.setText(task.getName());
        
        // Disable listener temporarily during bind to avoid recursive triggering
        holder.switchActive.setOnCheckedChangeListener(null);
        holder.switchActive.setChecked(task.isActive());
        
        if (task.isActive()) {
            holder.textFrequency.setVisibility(View.VISIBLE);
            holder.textFrequency.setText(String.format("Every %d days", task.getFrequencyDays()));

            holder.layoutDates.setVisibility(View.VISIBLE);

            String notSetText = holder.itemView.getContext().getString(R.string.not_set);

            String lastDoneStr = task.getLastDoneDate() != null && !task.getLastDoneDate().isEmpty() && !"null".equalsIgnoreCase(task.getLastDoneDate())
                    ? task.getLastDoneDate()
                    : notSetText;
            holder.textLastDone.setText(holder.itemView.getContext().getString(R.string.last_done_label, lastDoneStr));

            String dueByStr = task.getDueDate() != null && !task.getDueDate().isEmpty() && !"null".equalsIgnoreCase(task.getDueDate())
                    ? task.getDueDate()
                    : notSetText;
            holder.textDueBy.setText(holder.itemView.getContext().getString(R.string.due_by_label, dueByStr));

            holder.textLastDone.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onEditLastDoneDate(task);
                }
            });
        } else {
            holder.textFrequency.setVisibility(View.GONE);
            holder.layoutDates.setVisibility(View.GONE);
            holder.textLastDone.setOnClickListener(null);
        }
        
        holder.switchActive.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (listener != null) {
                if (isChecked) {
                    listener.onTaskActivated(task);
                } else {
                    listener.onTaskDeactivated(task);
                }
            }
        });

        holder.itemView.setOnLongClickListener(v -> {
            if (listener != null) {
                listener.onDeleteTask(task);
            }
            return true;
        });
    }

    @Override
    public int getItemCount() {
        return tasks.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView textTaskName;
        TextView textFrequency;
        View layoutDates;
        TextView textLastDone;
        TextView textDueBy;
        SwitchCompat switchActive;

        ViewHolder(View itemView) {
            super(itemView);
            textTaskName = itemView.findViewById(R.id.text_task_name);
            textFrequency = itemView.findViewById(R.id.text_frequency);
            layoutDates = itemView.findViewById(R.id.layout_dates);
            textLastDone = itemView.findViewById(R.id.text_last_done);
            textDueBy = itemView.findViewById(R.id.text_due_by);
            switchActive = itemView.findViewById(R.id.switch_active);
        }
    }
}
