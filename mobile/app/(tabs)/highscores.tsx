import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../src/context/HouseholdContext';
import { LeaderboardItem } from '../../src/components/LeaderboardItem';
import { UserStatsModal } from '../../src/components/UserStatsModal';
import { HighscoreEntry } from '../../src/types';
import { getGlobalHighscores } from '../../src/services/api';
import { Colors } from '../../src/theme/colors';

type TabMode = 'HOUSEHOLD' | 'GLOBAL';

export default function HighscoresScreen() {
  const router = useRouter();
  const { household, userUuid, highscores: householdHighscores, leaveHousehold } = useHousehold();
  
  const [tabMode, setTabMode] = useState<TabMode>('HOUSEHOLD');
  const [globalHighscores, setGlobalHighscores] = useState<HighscoreEntry[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<HighscoreEntry | null>(null);
  const [statsModalVisible, setStatsModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (tabMode === 'GLOBAL') {
      fetchGlobalHighscores();
    }
  }, [tabMode]);

  const fetchGlobalHighscores = async () => {
    try {
      setLoadingGlobal(true);
      const data = await getGlobalHighscores();
      setGlobalHighscores(data);
    } catch (err) {
      console.error('Failed to fetch global highscores:', err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const handleUserPress = (entry: HighscoreEntry) => {
    setSelectedUser(entry);
    setStatsModalVisible(true);
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to disconnect from this household?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveHousehold();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const displayScores = tabMode === 'HOUSEHOLD' ? householdHighscores : globalHighscores;

  return (
    <View style={styles.container}>
      {/* Household Info Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerInfo}>
          <Text style={styles.householdName}>{household?.name || 'Household'}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>JOIN CODE:</Text>
            <Text style={styles.codeValue}>{household?.join_code}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Leaderboard Mode Segment Toggle */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, tabMode === 'HOUSEHOLD' && styles.segmentActive]}
          onPress={() => setTabMode('HOUSEHOLD')}
        >
          <Ionicons name="people" size={16} color={tabMode === 'HOUSEHOLD' ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.segmentText, tabMode === 'HOUSEHOLD' && styles.segmentTextActive]}>
            Household
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tabMode === 'GLOBAL' && styles.segmentActive]}
          onPress={() => setTabMode('GLOBAL')}
        >
          <Ionicons name="globe" size={16} color={tabMode === 'GLOBAL' ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.segmentText, tabMode === 'GLOBAL' && styles.segmentTextActive]}>
            Global
          </Text>
        </TouchableOpacity>
      </View>

      {loadingGlobal && tabMode === 'GLOBAL' ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={displayScores}
          keyExtractor={(item, idx) => `${item.user_uuid}-${idx}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LeaderboardItem
              entry={item}
              isCurrentUser={item.user_uuid === userUuid}
              onPress={handleUserPress}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No rankings recorded yet.</Text>
            </View>
          }
        />
      )}

      <UserStatsModal
        visible={statsModalVisible}
        householdId={household?.household_id || null}
        user={selectedUser}
        onClose={() => setStatsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 18,
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 1,
  },
  leaveButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
