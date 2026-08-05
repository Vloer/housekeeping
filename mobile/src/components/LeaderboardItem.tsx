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
        <View style={[styles.rankContainer, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
          <Text style={[styles.rankText, { color: Colors.gold }]}>🥇 1</Text>
        </View>
      );
    }
    if (entry.rank === 2) {
      return (
        <View style={[styles.rankContainer, { backgroundColor: 'rgba(156, 163, 175, 0.2)' }]}>
          <Text style={[styles.rankText, { color: Colors.silver }]}>🥈 2</Text>
        </View>
      );
    }
    if (entry.rank === 3) {
      return (
        <View style={[styles.rankContainer, { backgroundColor: 'rgba(217, 119, 6, 0.2)' }]}>
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
      activeOpacity={0.7}
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentUserCard: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  rankContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  currentUserText: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pointsNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
  },
  pointsUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 4,
  },
});
