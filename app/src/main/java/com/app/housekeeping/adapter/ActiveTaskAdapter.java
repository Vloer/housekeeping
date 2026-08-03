package com.app.housekeeping.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.model.ActiveTask;
import com.app.housekeeping.util.ColorUtil;

import java.util.ArrayList;
import java.util.List;

public class ActiveTaskAdapter extends RecyclerView.Adapter<ActiveTaskAdapter.ViewHolder> {

    private final List<ActiveTask> tasks = new ArrayList<>();
    private final OnTaskActionListener listener;

    public interface OnTaskActionListener {
        void onTaskDone(ActiveTask task);
        void onEditLastDoneDate(ActiveTask task);
        void onEditTask(ActiveTask task);
    }

    public ActiveTaskAdapter(List<ActiveTask> initialTasks, OnTaskActionListener listener) {
        if (initialTasks != null) {
            this.tasks.addAll(initialTasks);
        }
        this.listener = listener;
    }

    public void updateTasks(List<ActiveTask> newTasks) {
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
                .inflate(R.layout.item_active_task, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ActiveTask task = tasks.get(position);
        
        holder.textTaskName.setText(task.getTaskName());
        
        int daysOverdue = task.getDaysOverdue();
        String dueStatus;
        if (daysOverdue > 1) {
            dueStatus = String.format("%d days overdue", daysOverdue);
        } else if (daysOverdue == 1) {
            dueStatus = "1 day overdue";
        } else if (daysOverdue == 0) {
            dueStatus = "Due today";
        } else if (daysOverdue == -1) {
            dueStatus = "Due tomorrow";
        } else {
            dueStatus = String.format("Due in %d days", Math.abs(daysOverdue));
        }
        holder.textDueStatus.setText(dueStatus);

        String lastDoneStr = task.getLastDoneDate() != null && !task.getLastDoneDate().isEmpty() 
                ? task.getLastDoneDate() : "Never";
        holder.textLastDone.setText(holder.itemView.getContext().getString(R.string.last_done_label, lastDoneStr));

        String dueByStr = task.getDueDate() != null && !task.getDueDate().isEmpty() 
                ? task.getDueDate() : "Not set";
        holder.textDueBy.setText(holder.itemView.getContext().getString(R.string.due_by_label, dueByStr));
        
        int color = ColorUtil.getUrgencyColor(daysOverdue, task.getFrequencyDays());
        holder.colorBar.setBackgroundColor(color);
        
        holder.btnDone.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTaskDone(task);
            }
        });

        holder.btnEdit.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditTask(task);
            }
        });

        holder.itemView.setOnLongClickListener(v -> {
            if (listener != null) {
                listener.onEditTask(task);
            }
            return true;
        });

        holder.textLastDone.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditLastDoneDate(task);
            }
        });
    }

    @Override
    public int getItemCount() {
        return tasks.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        View colorBar;
        TextView textTaskName;
        TextView textDueStatus;
        TextView textLastDone;
        TextView textDueBy;
        ImageButton btnEdit;
        Button btnDone;

        ViewHolder(View itemView) {
            super(itemView);
            colorBar = itemView.findViewById(R.id.color_bar);
            textTaskName = itemView.findViewById(R.id.text_task_name);
            textDueStatus = itemView.findViewById(R.id.text_due_status);
            textLastDone = itemView.findViewById(R.id.text_last_done);
            textDueBy = itemView.findViewById(R.id.text_due_by);
            btnEdit = itemView.findViewById(R.id.btn_edit);
            btnDone = itemView.findViewById(R.id.btn_done);
        }
    }
}
