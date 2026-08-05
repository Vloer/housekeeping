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
      Alert.alert('Task Completed! 🎉', `Awesome job! You earned +${result.points} points!`);
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

  // Sort active tasks by frequency_days ASC, then days_overdue ASC
  const sortedActiveTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
      if (a.frequency_days !== b.frequency_days) {
        return a.frequency_days - b.frequency_days;
      }
      return a.days_overdue - b.days_overdue;
    });
  }, [activeTasks]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Find matching catalog task to check if custom
  const currentCatalogTask = editingTask
    ? catalogTasks.find((c) => c.id === editingTask.catalog_task_id)
    : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedActiveTasks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryLight}
          />
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
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.secondary} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No active tasks due right now. Go to the Task Catalog tab to activate more tasks.
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
