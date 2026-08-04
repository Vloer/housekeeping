package com.app.housekeeping.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.app.housekeeping.R;
import com.app.housekeeping.model.HighscoreEntry;

import java.util.List;

public class HighscoreAdapter extends RecyclerView.Adapter<HighscoreAdapter.ViewHolder> {

    private List<HighscoreEntry> entries;
    private OnUserClickListener listener;

    public interface OnUserClickListener {
        void onUserClick(HighscoreEntry entry);
    }

    public HighscoreAdapter(List<HighscoreEntry> entries) {
        this(entries, null);
    }

    public HighscoreAdapter(List<HighscoreEntry> entries, OnUserClickListener listener) {
        this.entries = entries;
        this.listener = listener;
    }

    public void updateEntries(List<HighscoreEntry> newEntries) {
        this.entries = newEntries;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_highscore, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        HighscoreEntry entry = entries.get(position);
        holder.textRank.setText("#" + entry.getRank());
        holder.textUsername.setText(entry.getUsername());
        holder.textPoints.setText(entry.getPoints() + " pts");

        if (listener != null) {
            holder.itemView.setOnClickListener(v -> listener.onUserClick(entry));
        } else {
            holder.itemView.setOnClickListener(null);
        }
    }

    @Override
    public int getItemCount() {
        return entries != null ? entries.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView textRank;
        TextView textUsername;
        TextView textPoints;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            textRank = itemView.findViewById(R.id.text_rank);
            textUsername = itemView.findViewById(R.id.text_username);
            textPoints = itemView.findViewById(R.id.text_points);
        }
    }
}
