import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CatalogTask } from '../types';
import { Colors } from '../theme/colors';
import { useLanguage } from '../i18n';

interface CatalogItemCardProps {
  task: CatalogTask;
  onToggleActive: (task: CatalogTask) => void;
  onEdit: (task: CatalogTask) => void;
  onDelete?: (taskId: number) => void;
}

const CatalogItemCardComponent: React.FC<CatalogItemCardProps> = ({
  task,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const { i18n, t, getTaskName } = useLanguage();

  return (
    <View style={[styles.card, task.is_active && styles.cardActive]}>
      {/* Status Strip Indicator */}
      <View style={[styles.statusStrip, task.is_active ? styles.statusStripActive : styles.statusStripInactive]} />

      <View style={styles.content}>
        {/* Header Row: Task Name & Badges */}
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{getTaskName(task.name)}</Text>
          {task.is_custom && (
            <View style={styles.customBadge}>
              <Ionicons name="sparkles" size={10} color={Colors.accent} style={{ marginRight: 2 }} />
              <Text style={styles.customBadgeText}>{i18n.components.catalogItemCard.custom}</Text>
            </View>
          )}
        </View>

        {/* Uncluttered Meta Row: Frequency & Last Done Summary */}
        <View style={styles.metaRow}>
          <Text style={styles.freqText}>
            {t(i18n.components.catalogItemCard.everyDays, { days: task.frequency_days })}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.dateText}>
            {i18n.components.catalogItemCard.lastDone} {task.last_done_date || i18n.components.catalogItemCard.never}
          </Text>
        </View>
      </View>

      {/* 3 Icon-Only Action Buttons: Activate, Change, Delete */}
      <View style={styles.actionRow}>
        {/* 1. Activate Button */}
        <TouchableOpacity
          style={[styles.iconButton, task.is_active ? styles.activateBtnActive : styles.activateBtnInactive]}
          onPress={() => onToggleActive(task)}
          activeOpacity={0.7}
          accessibilityLabel={task.is_active ? "Deactivate chore" : "Activate chore"}
          accessibilityRole="button"
        >
          <Ionicons
            name={task.is_active ? "checkmark-circle" : "checkmark-circle-outline"}
            size={18}
            color={task.is_active ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>

        {/* 2. Change (Edit) Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.changeBtn]}
          onPress={() => onEdit(task)}
          activeOpacity={0.7}
          accessibilityLabel="Edit chore"
          accessibilityRole="button"
        >
          <Ionicons name="create-outline" size={18} color={Colors.secondary} />
        </TouchableOpacity>

        {/* 3. Delete Button (Disabled and greyed out for preinstalled tasks) */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            task.is_custom ? styles.deleteBtnActive : styles.deleteBtnDisabled,
          ]}
          onPress={() => task.is_custom && onDelete?.(task.id)}
          disabled={!task.is_custom}
          activeOpacity={0.7}
          accessibilityLabel={t(i18n.components.catalogItemCard.deleteTaskAccess, { name: task.name })}
          accessibilityRole="button"
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={task.is_custom ? Colors.danger : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CatalogItemCard = memo(CatalogItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    borderColor: 'rgba(26, 83, 92, 0.22)',
    backgroundColor: '#FFFFFF',
  },
  statusStrip: {
    width: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freqText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  activateBtnActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(26, 83, 92, 0.2)',
  },
  activateBtnInactive: {
    backgroundColor: Colors.surfaceSoft,
    borderColor: Colors.border,
  },
  changeBtn: {
    backgroundColor: Colors.secondarySoft,
    borderColor: 'rgba(42, 157, 143, 0.2)',
  },
  deleteBtnActive: {
    backgroundColor: Colors.dangerSoft,
    borderColor: 'rgba(230, 57, 70, 0.2)',
  },
  deleteBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.4,
  },
});
