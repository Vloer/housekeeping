import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveTask } from '../types';
import { Colors } from '../theme/colors';

interface TaskCardProps {
  task: ActiveTask;
  onComplete: (taskId: number) => void;
  onLongPress?: (task: ActiveTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onLongPress }) => {
  const getStatusBadge = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const isOverdue = task.days_overdue > 0;
    const isDueToday = task.days_overdue === 0 || task.due_date === todayStr;
    const isDueTomorrow = task.days_overdue === -1 || task.due_date === tomorrowStr;

    if (isOverdue) {
      return (
        <View style={[styles.badge, { backgroundColor: Colors.badgeOverdue }]}>
          <Text style={styles.badgeText}>Overdue ({task.days_overdue}d)</Text>
        </View>
      );
    }
    if (isDueToday) {
      return (
        <View style={[styles.badge, { backgroundColor: Colors.badgeDueSoon }]}>
          <Text style={styles.badgeText}>Due Today</Text>
        </View>
      );
    }
    if (isDueTomorrow) {
      return (
        <View style={[styles.badge, { backgroundColor: Colors.badgeDueSoon }]}>
          <Text style={styles.badgeText}>Due Tomorrow</Text>
        </View>
      );
    }

    const inDays = Math.abs(task.days_overdue);
    return (
      <View style={[styles.badge, { backgroundColor: Colors.badgeOk }]}>
        <Text style={styles.badgeText}>Due in {inDays} days</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onLongPress={() => onLongPress?.(task)}
    >
      {/* Prominent Mark Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => onComplete(task.id)}
        activeOpacity={0.75}
        accessibilityLabel="Mark task as completed"
        accessibilityRole="button"
      >
        <Ionicons name="checkmark-circle" size={32} color={Colors.secondary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{task.task_name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.frequencyText}>Every {task.frequency_days} days</Text>
          {getStatusBadge()}
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>+{task.frequency_days}</Text>
        <Text style={styles.ptsLabel}>pts</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButton: {
    marginRight: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frequencyText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  pointsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  ptsLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
