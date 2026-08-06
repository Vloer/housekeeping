import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { BaseModal } from './common/BaseModal';
import { HighscoreEntry, UserTaskStat } from '../types';
import { getUserTaskStats } from '../services/api';
import { Colors } from '../theme/colors';
import i18n, { t, getTaskName } from '../i18n';

interface UserStatsModalProps {
  visible: boolean;
  householdId: number | null;
  user: HighscoreEntry | null;
  onClose: () => void;
}

export const UserStatsModal: React.FC<UserStatsModalProps> = ({
  visible,
  householdId,
  user,
  onClose,
}) => {
  const [stats, setStats] = useState<UserTaskStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && householdId && user) {
      fetchStats();
    }
  }, [visible, householdId, user]);

  const fetchStats = async () => {
    if (!householdId || !user) return;
    try {
      setLoading(true);
      const data = await getUserTaskStats(householdId, user.user_uuid);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch user task stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <BaseModal
      visible={visible}
      title={t(i18n.modals.userStats.achievementsTitle, { username: user.username })}
      onClose={onClose}
    >
      <View style={styles.pointsBanner}>
        <Text style={styles.pointsLabel}>{i18n.modals.userStats.totalPointsLabel}</Text>
        <Text style={styles.pointsValue}>{user.points} {i18n.modals.userStats.pts}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={stats}
          keyExtractor={(item, index) => `${item.task_name}-${index}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.statItem}>
              <View style={styles.statMain}>
                <Text style={styles.taskName}>{getTaskName(item.task_name)}</Text>
                <Text style={styles.completionsText}>
                  {item.completions_count === 1
                    ? i18n.modals.userStats.completedSingle
                    : t(i18n.modals.userStats.completedPlural, { count: item.completions_count })}
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statPoints}>+{item.total_points}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{i18n.modals.userStats.emptyText}</Text>
            </View>
          }
        />
      )}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  pointsBanner: {
    backgroundColor: Colors.accentSoft,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accent,
  },
  loader: {
    paddingVertical: 30,
  },
  list: {
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statMain: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  completionsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
