import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../../src/context/HouseholdContext';
import { LeaderboardItem } from '../../src/components/LeaderboardItem';
import { UserStatsModal } from '../../src/components/UserStatsModal';
import { HighscoreEntry } from '../../src/types';
import { getGlobalHighscores } from '../../src/services/api';
import { Colors } from '../../src/theme/colors';
import { useLanguage } from '../../src/i18n';

type TabMode = 'HOUSEHOLD' | 'GLOBAL';

export default function HighscoresScreen() {
  const router = useRouter();
  const { i18n } = useLanguage();
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

  const handleUserPress = useCallback((entry: HighscoreEntry) => {
    setSelectedUser(entry);
    setStatsModalVisible(true);
  }, []);

  const handleLeave = () => {
    Alert.alert(
      i18n.highscoresScreen.leaveTitle,
      i18n.highscoresScreen.leaveMessage,
      [
        { text: i18n.onboarding.cancel, style: 'cancel' },
        {
          text: i18n.highscoresScreen.leaveConfirm,
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

  const firstPlace = displayScores.find((s) => s.rank === 1);
  const secondPlace = displayScores.find((s) => s.rank === 2);
  const thirdPlace = displayScores.find((s) => s.rank === 3);
  const remainingScores = displayScores.filter((s) => s.rank > 3);

  const renderLeaderboardItem = useCallback(
    ({ item }: { item: HighscoreEntry }) => (
      <LeaderboardItem
        entry={item}
        isCurrentUser={item.user_uuid === userUuid}
        onPress={handleUserPress}
      />
    ),
    [userUuid, handleUserPress]
  );

  const keyExtractor = useCallback((item: HighscoreEntry, idx: number) => `${item.user_uuid}-${idx}`, []);

  const renderPodium = () => {
    if (!firstPlace) return null;

    return (
      <View style={styles.podiumCard}>
        <Text style={styles.podiumTitle}>
          {tabMode === 'GLOBAL' ? i18n.highscoresScreen.podiumGlobalTitle : i18n.highscoresScreen.podiumHouseholdTitle}
        </Text>
        <View style={styles.podiumRow}>
          {/* 2nd Place */}
          <View style={styles.podiumCol}>
            {secondPlace ? (
              <TouchableOpacity onPress={() => handleUserPress(secondPlace)} style={styles.podiumUser}>
                <View style={[styles.avatarCircle, { borderColor: Colors.silver }]}>
                  <Text style={styles.avatarText}>{secondPlace.username.charAt(0).toUpperCase()}</Text>
                  <View style={[styles.rankBadgeMini, { backgroundColor: Colors.silver }]}>
                    <Text style={styles.rankBadgeText}>2</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{secondPlace.username}</Text>
                <Text style={styles.podiumPts}>{secondPlace.points} {i18n.highscoresScreen.pts}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.podiumEmpty} />
            )}
          </View>

          {/* 1st Place (Elevated Center) */}
          <View style={[styles.podiumCol, styles.podiumColCenter]}>
            <TouchableOpacity onPress={() => handleUserPress(firstPlace)} style={styles.podiumUser}>
              <View style={[styles.avatarCircle, styles.avatarCircleFirst, { borderColor: Colors.gold }]}>
                <Text style={styles.avatarTextFirst}>{firstPlace.username.charAt(0).toUpperCase()}</Text>
                <View style={[styles.rankBadgeMini, { backgroundColor: Colors.gold }]}>
                  <Text style={styles.rankBadgeText}>1</Text>
                </View>
              </View>
              <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                👑 {firstPlace.username}
              </Text>
              <Text style={styles.podiumPtsFirst}>{firstPlace.points} {i18n.highscoresScreen.pts}</Text>
            </TouchableOpacity>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumCol}>
            {thirdPlace ? (
              <TouchableOpacity onPress={() => handleUserPress(thirdPlace)} style={styles.podiumUser}>
                <View style={[styles.avatarCircle, { borderColor: Colors.bronze }]}>
                  <Text style={styles.avatarText}>{thirdPlace.username.charAt(0).toUpperCase()}</Text>
                  <View style={[styles.rankBadgeMini, { backgroundColor: Colors.bronze }]}>
                    <Text style={styles.rankBadgeText}>3</Text>
                  </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{thirdPlace.username}</Text>
                <Text style={styles.podiumPts}>{thirdPlace.points} {i18n.highscoresScreen.pts}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.podiumEmpty} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Household Info Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerInfo}>
          <Text style={styles.householdName}>{household?.name || i18n.highscoresScreen.householdBannerDefault}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>{i18n.highscoresScreen.joinCodeLabel}</Text>
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
            {i18n.highscoresScreen.tabHousehold}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tabMode === 'GLOBAL' && styles.segmentActive]}
          onPress={() => setTabMode('GLOBAL')}
        >
          <Ionicons name="globe" size={16} color={tabMode === 'GLOBAL' ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.segmentText, tabMode === 'GLOBAL' && styles.segmentTextActive]}>
            {i18n.highscoresScreen.tabGlobal}
          </Text>
        </TouchableOpacity>
      </View>

      {loadingGlobal && tabMode === 'GLOBAL' ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={displayScores.length <= 3 ? displayScores : remainingScores}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          ListHeaderComponent={displayScores.length > 0 ? renderPodium() : null}
          renderItem={renderLeaderboardItem}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{i18n.highscoresScreen.emptyText}</Text>
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '800',
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
    color: Colors.primary,
    letterSpacing: 1,
  },
  leaveButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.dangerSoft,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
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
    borderRadius: 10,
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
  podiumCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  podiumTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumColCenter: {
    marginBottom: 12,
  },
  podiumUser: {
    alignItems: 'center',
  },
  podiumEmpty: {
    height: 80,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 6,
    position: 'relative',
  },
  avatarCircleFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  avatarTextFirst: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  rankBadgeMini: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
    maxWidth: 80,
  },
  podiumNameFirst: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  podiumPts: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
  },
  podiumPtsFirst: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accent,
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
