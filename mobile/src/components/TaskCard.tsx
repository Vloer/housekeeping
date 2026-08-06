import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveTask } from '../types';
import { Colors } from '../theme/colors';
import { getTodayStr, getOverdueTheme } from '../utils/dateUtils';
import { useLanguage } from '../i18n';

interface TaskCardProps {
  task: ActiveTask;
  onComplete: (taskId: number) => void;
  onLongPress?: (task: ActiveTask) => void;
}

const TaskCardComponent: React.FC<TaskCardProps> = ({ task, onComplete, onLongPress }) => {
  const { i18n, t, getTaskName } = useLanguage();
  const isOverdue = task.days_overdue > 0;
  const todayStr = getTodayStr();
  const isDueToday = task.days_overdue === 0 || task.due_date === todayStr;

  const getStatusBadge = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const isDueTomorrow = task.days_overdue === -1 || task.due_date === tomorrowStr;

    // Overdue -> Lenient Progressive Red
    if (isOverdue) {
      const theme = getOverdueTheme(task.days_overdue);
      return (
        <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Ionicons name="alert-circle" size={12} color={theme.text} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: theme.text }]}>
            {t(i18n.components.taskCard.overdue, { days: task.days_overdue })}
          </Text>
        </View>
      );
    }

    // Due Today -> Amber / Soft Yellow
    if (isDueToday) {
      return (
        <View style={[styles.badge, { backgroundColor: Colors.accentSoft, borderColor: 'rgba(244, 162, 97, 0.3)' }]}>
          <Ionicons name="time" size={12} color={Colors.accent} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: Colors.accent }]}>{i18n.components.taskCard.dueToday}</Text>
        </View>
      );
    }

    // Due Tomorrow or in X Days -> Green
    const inDays = Math.abs(task.days_overdue);
    return (
      <View style={[styles.badge, { backgroundColor: Colors.secondarySoft, borderColor: 'rgba(42, 157, 143, 0.3)' }]}>
        <Ionicons name="checkmark-circle-outline" size={12} color={Colors.secondary} style={{ marginRight: 4 }} />
        <Text style={[styles.badgeText, { color: Colors.secondary }]}>
          {isDueTomorrow ? i18n.components.taskCard.dueTomorrow : t(i18n.components.taskCard.dueInDays, { days: inDays })}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onLongPress={() => onLongPress?.(task)}
    >
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => onComplete(task.id)}
        activeOpacity={0.7}
        accessibilityLabel={i18n.components.taskCard.markAsCompleted}
        accessibilityRole="button"
      >
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{getTaskName(task.task_name)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.frequencyText}>{t(i18n.components.taskCard.repeat, { days: task.frequency_days })}</Text>
          <Text style={styles.dot}>•</Text>
          {getStatusBadge()}
        </View>
      </View>

      <View style={styles.pointsBadge}>
        <Ionicons name="star" size={12} color={Colors.accent} style={{ marginRight: 3 }} />
        <Text style={styles.pointsNumber}>+{task.frequency_days}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const TaskCard = memo(TaskCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  doneButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  frequencyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
    marginLeft: 8,
  },
  pointsNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent,
  },
});
