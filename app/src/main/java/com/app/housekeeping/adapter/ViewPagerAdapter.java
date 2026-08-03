package com.app.housekeeping.adapter;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.app.housekeeping.fragment.ActiveTasksFragment;
import com.app.housekeeping.fragment.TaskCatalogFragment;
import com.app.housekeeping.fragment.HighscoresFragment;
import com.app.housekeeping.household.HouseholdManager;
import com.app.housekeeping.model.Household;

import java.util.List;

public class ViewPagerAdapter extends FragmentStateAdapter {

    private final FragmentActivity fragmentActivity;

    public ViewPagerAdapter(@NonNull FragmentActivity fragmentActivity) {
        super(fragmentActivity);
        this.fragmentActivity = fragmentActivity;
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        if (position == 0) {
            return new ActiveTasksFragment();
        } else if (position == 1) {
            return new TaskCatalogFragment();
        } else if (position == 2) {
            int currentId = HouseholdManager.getInstance(fragmentActivity).getHouseholdId();
            return HighscoresFragment.newInstanceForHousehold(currentId);
        } else {
            return HighscoresFragment.newInstanceGlobal();
        }
    }

    @Override
    public int getItemCount() {
        return 4;
    }
}
