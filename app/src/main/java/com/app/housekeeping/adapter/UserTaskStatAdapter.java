package com.app.housekeeping.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.model.UserTaskStat;

import java.util.List;

public class UserTaskStatAdapter extends RecyclerView.Adapter<UserTaskStatAdapter.ViewHolder> {

    private final List<UserTaskStat> stats;

    public UserTaskStatAdapter(List<UserTaskStat> stats) {
        this.stats = stats;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_user_task_stat, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        UserTaskStat stat = stats.get(position);
        holder.textTaskName.setText(stat.getTaskName());
        String statText = holder.itemView.getContext().getString(
                R.string.user_task_stat_format,
                stat.getCompletionsCount(),
                stat.getTotalPoints()
        );
        holder.textCompletionsCount.setText(statText);
    }

    @Override
    public int getItemCount() {
        return stats != null ? stats.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView textTaskName;
        TextView textCompletionsCount;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            textTaskName = itemView.findViewById(R.id.text_task_name);
            textCompletionsCount = itemView.findViewById(R.id.text_completions_count);
        }
    }
}
