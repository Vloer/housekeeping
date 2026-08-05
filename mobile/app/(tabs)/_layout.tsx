import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../src/context/HouseholdContext';
import { Colors } from '../../src/theme/colors';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { household, leaveHousehold } = useHousehold();

  // Generous bottom padding clear of phone navigation bar
  const bottomInset = Math.max(insets.bottom + 10, 18);

  const handleSwitchHousehold = () => {
    Alert.alert(
      'Switch Household',
      `Currently connected to "${household?.name || 'Household'}". Would you like to switch to a different household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Household',
          onPress: async () => {
            await leaveHousehold();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchHousehold}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={16} color={Colors.primaryLight} />
            <Text style={styles.switchButtonText} numberOfLines={1}>
              {household?.name || 'Switch'}
            </Text>
            <Ionicons name="swap-horizontal" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Active Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Task Catalog',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="highscores"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    maxWidth: 160,
  },
  switchButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
