import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HighscoreEntry } from '../types';
import { Colors } from '../theme/colors';

interface LeaderboardItemProps {
  entry: HighscoreEntry;
  isCurrentUser: boolean;
  onPress: (entry: HighscoreEntry) => void;
}

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ entry, isCurrentUser, onPress }) => {
  const getRankBadge = () => {
    if (entry.rank === 1) {
      return (
        <View style={[styles.rankContainer, { backgroundColor: Colors.accentSoft, borderColor: Colors.gold }]}>
          <Text style={[styles.rankText, { color: Colors.gold }]}>🥇 1</Text>
        </View>
      );
    }
    if (entry.rank === 2) {
      return (
        <View style={[styles.rankContainer, { backgroundColor: Colors.surfaceSoft, borderColor: Colors.silver }]}>
          <Text style={[styles.rankText, { color: Colors.silver }]}>🥈 2</Text>
        </View>
      );
    }
    if (entry.rank === 3) {
      return (
        <View style={[styles.rankContainer, { backgroundColor: Colors.surfaceSoft, borderColor: Colors.bronze }]}>
          <Text style={[styles.rankText, { color: Colors.bronze }]}>🥉 3</Text>
        </View>
      );
    }
    return (
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{entry.rank}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, isCurrentUser && styles.currentUserCard]}
      onPress={() => onPress(entry)}
      activeOpacity={0.8}
    >
      {getRankBadge()}

      <View style={styles.userInfo}>
        <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
          {entry.username} {isCurrentUser ? '(You)' : ''}
        </Text>
      </View>

      <View style={styles.pointsBadge}>
        <Text style={styles.pointsNumber}>{entry.points}</Text>
        <Text style={styles.pointsUnit}>pts</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
};

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
  currentUserCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  rankContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  currentUserText: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pointsNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accent,
  },
  pointsUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  arrow: {
    marginLeft: 4,
  },
});
