package com.app.housekeeping.adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.app.housekeeping.fragment.ActiveTasksFragment;
import com.app.housekeeping.fragment.TaskCatalogFragment;

public class ViewPagerAdapter extends FragmentStateAdapter {

    public ViewPagerAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        if (position == 1) {
            return new TaskCatalogFragment();
        }
        return new ActiveTasksFragment();
    }

    @Override
    public int getItemCount() {
        return 2;
    }
}
