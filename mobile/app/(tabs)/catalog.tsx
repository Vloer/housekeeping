import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../src/context/HouseholdContext';
import { CatalogItemCard } from '../../src/components/CatalogItemCard';
import { AddCustomTaskModal } from '../../src/components/AddCustomTaskModal';
import { EditTaskModal } from '../../src/components/EditTaskModal';
import { CatalogTask, FrequencyType } from '../../src/types';
import { Colors } from '../../src/theme/colors';

const FILTER_CHIPS: { label: string; value: FrequencyType }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Weekly (≤7d)', value: 'DAILY' },
  { label: 'Bi-Weekly (≤14d)', value: 'WEEKLY' },
  { label: 'Monthly (≤30d)', value: 'MONTHLY' },
  { label: 'Long-term (>30d)', value: 'AS_NEEDED' },
];

export default function TaskCatalogScreen() {
  const {
    catalogTasks,
    activateTaskOptimistic,
    deactivateTaskOptimistic,
    addCustomTaskOptimistic,
    deleteTaskOptimistic,
    updateTaskDetailsOptimistic,
    updateTaskLastDoneOptimistic,
  } = useHousehold();

  const [selectedFilter, setSelectedFilter] = useState<FrequencyType>('ALL');
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<CatalogTask | null>(null);

  const filteredTasks = useMemo(() => {
    return catalogTasks.filter((task) => {
      const days = task.frequency_days || task.default_frequency_days;
      if (selectedFilter === 'DAILY') return days <= 7;
      if (selectedFilter === 'WEEKLY') return days > 7 && days <= 14;
      if (selectedFilter === 'MONTHLY') return days > 14 && days <= 30;
      if (selectedFilter === 'AS_NEEDED') return days > 30;
      return true;
    });
  }, [catalogTasks, selectedFilter]);

  const handleToggleActive = (task: CatalogTask) => {
    if (task.is_active) {
      deactivateTaskOptimistic(task.id);
    } else {
      activateTaskOptimistic(task.id, task.default_frequency_days);
    }
  };

  const handleDelete = (taskId: number) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this custom task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTaskOptimistic(taskId),
      },
    ]);
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

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item.value && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text style={[styles.filterChipText, selectedFilter === item.value && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CatalogItemCard
            task={item}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onLongPress={(task) => setEditingTask(task)}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <AddCustomTaskModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={addCustomTaskOptimistic}
      />

      <EditTaskModal
        visible={editingTask !== null}
        taskData={
          editingTask
            ? {
                catalogTaskId: editingTask.id,
                activeTaskId: editingTask.active_id,
                name: editingTask.name,
                frequencyDays: editingTask.frequency_days,
                lastDoneDate: editingTask.last_done_date,
                isCustom: editingTask.is_custom,
              }
            : null
        }
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTaskEdits}
        onDelete={async (catId) => deleteTaskOptimistic(catId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    backgroundColor: Colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
