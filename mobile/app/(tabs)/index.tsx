import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../src/context/HouseholdContext';
import { TaskCard } from '../../src/components/TaskCard';
import { EditTaskModal } from '../../src/components/EditTaskModal';
import { ActiveTask } from '../../src/types';
import { Colors } from '../../src/theme/colors';

export default function ActiveTasksScreen() {
  const router = useRouter();
  const {
    household,
    activeTasks,
    catalogTasks,
    loading,
    refreshData,
    markTaskDoneOptimistic,
    updateTaskLastDoneOptimistic,
    updateTaskDetailsOptimistic,
    deleteTaskOptimistic,
  } = useHousehold();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ActiveTask | null>(null);

  useEffect(() => {
    if (!loading && !household) {
      router.replace('/onboarding');
    }
  }, [household, loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const result = await markTaskDoneOptimistic(taskId);
      Alert.alert('Task Done! 🎉', `Awesome work! You earned +${result.points} points for keeping your home up to date! 🌿`);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleSaveTaskEdits = async (data: {
    catalogTaskId: number;
    activeTaskId?: number | null;
    name: string;
    frequencyDays: number;
    lastDoneDate?: string;
  }) => {
    await updateTaskDetailsOptimistic(data.catalogTaskId, data.name, data.frequencyDays);
    if (data.activeTaskId && data.lastDoneDate) {
      await updateTaskLastDoneOptimistic(data.activeTaskId, data.lastDoneDate);
    }
  };

  const handleDeleteCustomTask = async (catalogTaskId: number) => {
    await deleteTaskOptimistic(catalogTaskId);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const in7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  // Compute Monday 00:00 to Sunday 23:59 date range for current week
  const weekRange = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const mon = new Date(now);
    mon.setDate(now.getDate() - distToMon);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return { mondayStr: format(mon), sundayStr: format(sun) };
  }, []);

  // Track task progress for ALL tasks available/due/completed THIS WEEK
  const thisWeekStats = useMemo(() => {
    const { mondayStr, sundayStr } = weekRange;

    const thisWeekTasks = activeTasks.filter((t) => {
      const isDueInWeek = !!(t.due_date && t.due_date >= mondayStr && t.due_date <= sundayStr);
      const wasDoneInWeek = !!(t.last_done_date && t.last_done_date >= mondayStr && t.last_done_date <= sundayStr);
      const isOverdue = t.days_overdue > 0;
      return isDueInWeek || wasDoneInWeek || isOverdue;
    });

    const completedCount = thisWeekTasks.filter((t) => {
      const wasDoneInWeek = !!(t.last_done_date && t.last_done_date >= mondayStr && t.last_done_date <= sundayStr);
      return wasDoneInWeek || t.days_overdue <= 0;
    }).length;

    const totalCount = thisWeekTasks.length;
    const overdueCount = thisWeekTasks.filter((t) => t.days_overdue > 0).length;

    return {
      completedCount,
      totalCount,
      overdueCount,
      ratio: totalCount === 0 ? 1 : completedCount / totalCount,
    };
  }, [activeTasks, weekRange]);

  // Actionable active tasks list: Remove completed tasks unless due in less than 7 days
  const visibleActiveTasks = useMemo(() => {
    const { mondayStr, sundayStr } = weekRange;

    return activeTasks
      .filter((t) => {
        // If completed today, remove from actionable list for today
        if (t.last_done_date === todayStr) {
          return false;
        }

        // If completed this week, remove unless next due_date is due in less than 7 days
        const wasDoneThisWeek = !!(
          t.last_done_date &&
          t.last_done_date >= mondayStr &&
          t.last_done_date <= sundayStr
        );

        if (wasDoneThisWeek) {
          if (!t.due_date || t.due_date > in7DaysStr) {
            return false;
          }
        }

        // Hide tasks whose next due date is > 7 days away
        if (t.due_date && t.due_date > in7DaysStr && t.days_overdue <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.frequency_days !== b.frequency_days) {
          return a.frequency_days - b.frequency_days;
        }
        return a.days_overdue - b.days_overdue;
      });
  }, [activeTasks, todayStr, weekRange, in7DaysStr]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentCatalogTask = editingTask
    ? catalogTasks.find((c) => c.id === editingTask.catalog_task_id)
    : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleActiveTasks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.houseName}>{household?.name || 'My Home'}</Text>
                <Text style={styles.summaryStatusText}>
                  {thisWeekStats.overdueCount === 0
                    ? `All ${thisWeekStats.totalCount} chores for this week are on schedule! 🌿`
                    : `${thisWeekStats.overdueCount} chore${thisWeekStats.overdueCount > 1 ? 's' : ''} overdue this week`}
                </Text>
              </View>

              <View
                style={[
                  styles.scheduleBadge,
                  thisWeekStats.overdueCount > 0 && { backgroundColor: Colors.dangerSoft, borderColor: 'rgba(231, 111, 81, 0.3)' },
                ]}
              >
                <Text
                  style={[
                    styles.scheduleBadgeNum,
                    thisWeekStats.overdueCount > 0 && { color: Colors.danger },
                  ]}
                >
                  {thisWeekStats.completedCount}/{thisWeekStats.totalCount}
                </Text>
                <Text
                  style={[
                    styles.scheduleBadgeLabel,
                    thisWeekStats.overdueCount > 0 && { color: Colors.danger },
                  ]}
                >
                  This Week
                </Text>
              </View>
            </View>

            {/* Clear On-Schedule Progress Bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(thisWeekStats.ratio * 100)}%`,
                    backgroundColor: thisWeekStats.overdueCount > 0 ? Colors.danger : Colors.secondary,
                  },
                ]}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleCompleteTask}
            onLongPress={(task) => setEditingTask(task)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="sparkles" size={38} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your Home is Sparkling!</Text>
            <Text style={styles.emptySubtitle}>
              No tasks due right now. Sit back and enjoy your clean home, or activate tasks from the catalog tab.
            </Text>
          </View>
        }
      />

      <EditTaskModal
        visible={editingTask !== null}
        taskData={
          editingTask
            ? {
                catalogTaskId: editingTask.catalog_task_id,
                activeTaskId: editingTask.id,
                name: editingTask.task_name,
                frequencyDays: editingTask.frequency_days,
                lastDoneDate: editingTask.last_done_date,
                isCustom: !!currentCatalogTask?.is_custom,
              }
            : null
        }
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTaskEdits}
        onDelete={handleDeleteCustomTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  houseName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scheduleBadge: {
    backgroundColor: Colors.secondarySoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.3)',
  },
  scheduleBadgeNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondary,
  },
  scheduleBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
