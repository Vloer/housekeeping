import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../src/context/HouseholdContext';
import { CatalogItemCard } from '../../src/components/CatalogItemCard';
import { AddCustomTaskModal } from '../../src/components/AddCustomTaskModal';
import { EditTaskModal } from '../../src/components/EditTaskModal';
import { CatalogTask } from '../../src/types';
import { Colors } from '../../src/theme/colors';
import i18n, { getTaskName } from '../../src/i18n';

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CUSTOM';

export default function CatalogScreen() {
  const {
    catalogTasks,
    activeTasks,
    activateTaskOptimistic,
    deactivateTaskOptimistic,
    addCustomTaskOptimistic,
    deleteTaskOptimistic,
    updateTaskDetailsAndLastDoneOptimistic,
  } = useHousehold();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<CatalogTask | null>(null);

  // Compute counts for filter tab badges
  const counts = useMemo(() => {
    const total = catalogTasks.length;
    const active = catalogTasks.filter((t) => t.is_active).length;
    const inactive = total - active;
    const custom = catalogTasks.filter((t) => t.is_custom).length;
    return { total, active, inactive, custom };
  }, [catalogTasks]);

  const filteredTasks = useMemo(() => {
    return catalogTasks.filter((task) => {
      const displayName = getTaskName(task.name);
      const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeFilter === 'ACTIVE') return task.is_active;
      if (activeFilter === 'INACTIVE') return !task.is_active;
      if (activeFilter === 'CUSTOM') return task.is_custom;
      return true;
    });
  }, [catalogTasks, searchQuery, activeFilter]);

  const handleToggleActive = useCallback(
    async (task: CatalogTask) => {
      if (task.is_active) {
        await deactivateTaskOptimistic(task.id);
      } else {
        await activateTaskOptimistic(task.id, task.frequency_days);
      }
    },
    [activateTaskOptimistic, deactivateTaskOptimistic]
  );

  const handleDeleteTask = useCallback(
    async (catalogTaskId: number) => {
      await deleteTaskOptimistic(catalogTaskId);
    },
    [deleteTaskOptimistic]
  );

  const handleTaskLongPress = useCallback((task: CatalogTask) => {
    setEditingTask(task);
  }, []);

  const handleSaveEdits = async (data: {
    catalogTaskId: number;
    activeTaskId?: number | null;
    name: string;
    frequencyDays: number;
    lastDoneDate?: string;
  }) => {
    let targetActiveId = data.activeTaskId;
    if (!targetActiveId) {
      const found = activeTasks.find((a) => a.catalog_task_id === data.catalogTaskId);
      if (found) targetActiveId = found.id;
    }
    await updateTaskDetailsAndLastDoneOptimistic(
      data.catalogTaskId,
      data.name,
      data.frequencyDays,
      targetActiveId,
      data.lastDoneDate
    );
  };

  const activeTaskForEditing = useMemo(() => {
    if (!editingTask) return null;
    return activeTasks.find((a) => a.catalog_task_id === editingTask.id);
  }, [editingTask, activeTasks]);

  const resolvedActiveTaskId = editingTask
    ? (editingTask.active_id || activeTaskForEditing?.id || null)
    : null;

  const resolvedLastDoneDate = editingTask
    ? (editingTask.last_done_date || activeTaskForEditing?.last_done_date || null)
    : null;

  const renderCatalogItem = useCallback(
    ({ item }: { item: CatalogTask }) => (
      <CatalogItemCard
        task={item}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteTask}
        onLongPress={handleTaskLongPress}
      />
    ),
    [handleToggleActive, handleDeleteTask, handleTaskLongPress]
  );

  const keyExtractor = useCallback((item: CatalogTask) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTasks}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Studio Catalog Banner */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>{i18n.catalogScreen.heroTitle}</Text>
                  <Text style={styles.heroSubtitle}>
                    {i18n.catalogScreen.heroSubtitle}
                  </Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeNum}>{counts.active}</Text>
                  <Text style={styles.heroBadgeLabel}>{i18n.catalogScreen.heroActive}</Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color={Colors.primary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={i18n.catalogScreen.searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textMuted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <View style={styles.filterRow}>
              {[
                { tab: 'ALL' as FilterTab, label: i18n.catalogScreen.filterAll, count: counts.total },
                { tab: 'ACTIVE' as FilterTab, label: i18n.catalogScreen.filterActive, count: counts.active },
                { tab: 'INACTIVE' as FilterTab, label: i18n.catalogScreen.filterInactive, count: counts.inactive },
                { tab: 'CUSTOM' as FilterTab, label: i18n.catalogScreen.filterCustom, count: counts.custom },
              ].map(({ tab, label, count }) => {
                const isSelected = activeFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setActiveFilter(tab)}
                  >
                    <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                      {label}
                    </Text>
                    <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
                      <Text style={[styles.countBadgeText, isSelected && styles.countBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={renderCatalogItem}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="journal-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{i18n.catalogScreen.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{i18n.catalogScreen.emptySubtitle}</Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) for Adding Custom Task */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.88}
        accessibilityLabel={i18n.modals.addCustomTask.title}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={22} color="#FFFFFF" style={{ marginRight: 4 }} />
        <Text style={styles.fabText}>{i18n.catalogScreen.newChoreFab}</Text>
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
                activeTaskId: resolvedActiveTaskId,
                isActive: editingTask.is_active,
                name: editingTask.name,
                frequencyDays: editingTask.frequency_days,
                lastDoneDate: resolvedLastDoneDate,
                isCustom: editingTask.is_custom,
              }
            : null
        }
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdits}
        onDelete={handleDeleteTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    marginBottom: 4,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    maxWidth: 220,
    lineHeight: 17,
  },
  heroBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 83, 92, 0.2)',
  },
  heroBadgeNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  heroBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: Colors.surfaceSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  countBadgeTextActive: {
    color: '#FFF',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
