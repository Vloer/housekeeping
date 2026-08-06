import React, { memo } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CatalogTask } from '../types';
import { Colors } from '../theme/colors';
import i18n, { t, getTaskName } from '../i18n';

interface CatalogItemCardProps {
  task: CatalogTask;
  onToggleActive: (task: CatalogTask) => void;
  onDelete?: (taskId: number) => void;
  onLongPress?: (task: CatalogTask) => void;
}

const CatalogItemCardComponent: React.FC<CatalogItemCardProps> = ({
  task,
  onToggleActive,
  onDelete,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, task.is_active && styles.cardActive]}
      activeOpacity={0.92}
      onLongPress={() => onLongPress?.(task)}
    >
      {/* Status Pillar Indicator Bar */}
      <View style={[styles.statusStrip, task.is_active ? styles.statusStripActive : styles.statusStripInactive]} />

      <View style={styles.content}>
        {/* Header Row: Task Name & Badges */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{getTaskName(task.name)}</Text>
          {task.is_custom && (
            <View style={styles.customBadge}>
              <Ionicons name="sparkles" size={10} color={Colors.accent} style={{ marginRight: 3 }} />
              <Text style={styles.customBadgeText}>{i18n.components.catalogItemCard.custom}</Text>
            </View>
          )}
        </View>

        {/* Frequency Subheader */}
        <View style={styles.metaRow}>
          <View style={styles.freqBadge}>
            <Ionicons name="repeat" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.freqText}>{t(i18n.components.catalogItemCard.everyDays, { days: task.frequency_days })}</Text>
          </View>

          {task.is_active && (
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>{i18n.components.catalogItemCard.activeChore}</Text>
            </View>
          )}
        </View>

        {/* Dates Row */}
        <View style={styles.datesRow}>
          <View style={styles.dateChip}>
            <Text style={styles.dateLabel}>{i18n.components.catalogItemCard.lastDone}</Text>
            <Text style={styles.dateValue}>{task.last_done_date || i18n.components.catalogItemCard.never}</Text>
          </View>

          <View style={styles.dateChip}>
            <Text style={styles.dateLabel}>{i18n.components.catalogItemCard.nextDue}</Text>
            <Text style={[styles.dateValue, task.is_active && styles.dateValueActive]}>
              {task.is_active ? (task.due_date || i18n.components.catalogItemCard.na) : i18n.components.catalogItemCard.inactive}
            </Text>
          </View>
        </View>
      </View>

      {/* Switch & Action Controls */}
      <View style={styles.actionColumn}>
        <Switch
          value={task.is_active}
          onValueChange={() => onToggleActive(task)}
          trackColor={{ false: '#E2E8F0', true: Colors.primary }}
          thumbColor={task.is_active ? '#FFFFFF' : '#CBD5E1'}
        />
        {task.is_custom && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            style={styles.deleteButton}
            accessibilityLabel={t(i18n.components.catalogItemCard.deleteTaskAccess, { name: task.name })}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const CatalogItemCard = memo(CatalogItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: {
    borderColor: 'rgba(26, 83, 92, 0.25)',
    backgroundColor: '#FFFFFF',
  },
  statusStrip: {
    width: 5,
    height: '100%',
  },
  statusStripActive: {
    backgroundColor: Colors.primary,
  },
  statusStripInactive: {
    backgroundColor: '#CBD5E1',
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freqText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginRight: 4,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateValueActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  actionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 14,
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.dangerSoft,
  },
});
