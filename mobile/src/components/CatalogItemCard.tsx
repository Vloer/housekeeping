import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CatalogTask } from '../types';
import { Colors } from '../theme/colors';

interface CatalogItemCardProps {
  task: CatalogTask;
  onToggleActive: (task: CatalogTask) => void;
  onDelete?: (taskId: number) => void;
  onLongPress?: (task: CatalogTask) => void;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ task, onToggleActive, onDelete, onLongPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onLongPress={() => onLongPress?.(task)}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{task.name}</Text>
          {task.is_custom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>

        <Text style={styles.frequency}>Every {task.frequency_days} days</Text>

        <View style={styles.datesRow}>
          <Text style={styles.dateText}>
            Last done: <Text style={styles.dateValue}>{task.last_done_date || 'Never'}</Text>
          </Text>
          <Text style={styles.dateDot}>•</Text>
          <Text style={styles.dateText}>
            Next due: <Text style={styles.dateValue}>{task.is_active ? (task.due_date || 'N/A') : 'Inactive'}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Switch
          value={task.is_active}
          onValueChange={() => onToggleActive(task)}
          trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
          thumbColor={task.is_active ? '#FFF' : Colors.textMuted}
        />
        {task.is_custom && onDelete && (
          <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  customBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
  },
  frequency: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dateValue: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dateDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
});
