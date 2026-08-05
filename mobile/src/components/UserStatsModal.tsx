import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HighscoreEntry, UserTaskStat } from '../types';
import { getUserTaskStats } from '../services/api';
import { Colors } from '../theme/colors';

interface UserStatsModalProps {
  visible: boolean;
  householdId: number | null;
  user: HighscoreEntry | null;
  onClose: () => void;
}

export const UserStatsModal: React.FC<UserStatsModalProps> = ({ visible, householdId, user, onClose }) => {
  const [stats, setStats] = useState<UserTaskStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible && householdId && user) {
      setLoading(true);
      getUserTaskStats(householdId, user.user_uuid)
        .then(setStats)
        .catch((err) => console.error('Failed to load user task stats:', err))
        .finally(() => setLoading(false));
    }
  }, [visible, householdId, user]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{user?.username}'s Task Stats</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : stats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No completed tasks recorded yet.</Text>
            </View>
          ) : (
            <FlatList
              data={stats}
              keyExtractor={(item, idx) => `${item.task_name}-${idx}`}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.statRow}>
                  <View style={styles.statInfo}>
                    <Text style={styles.taskName}>{item.task_name}</Text>
                    <Text style={styles.completions}>{item.completions_count} completion(s)</Text>
                  </View>
                  <Text style={styles.statPoints}>+{item.total_points} pts</Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  loader: {
    marginVertical: 40,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  list: {
    paddingBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  statInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  completions: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statPoints: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
  },
});
