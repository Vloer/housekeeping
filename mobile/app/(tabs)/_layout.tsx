import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHousehold } from '../../src/context/HouseholdContext';
import { Colors } from '../../src/theme/colors';
import i18n, { t } from '../../src/i18n';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { household, leaveHousehold } = useHousehold();

  // Generous bottom padding clear of phone navigation bar
  const bottomInset = Math.max(insets.bottom + 10, 18);

  const handleSwitchHousehold = () => {
    Alert.alert(
      i18n.tabs.switchHouseholdTitle,
      t(i18n.tabs.switchHouseholdMessage, { name: household?.name || i18n.highscoresScreen.householdBannerDefault }),
      [
        { text: i18n.onboarding.cancel, style: 'cancel' },
        {
          text: i18n.tabs.switchHouseholdBtn,
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
        headerRight: () => (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={handleSwitchHousehold}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={15} color={Colors.primary} />
            <Text style={styles.switchButtonText} numberOfLines={1}>
              {household?.name || i18n.tabs.switchDefault}
            </Text>
            <Ionicons name="swap-horizontal" size={15} color={Colors.textSecondary} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 4,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.tabs.activeTasks,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: i18n.tabs.taskCatalog,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="highscores"
        options={{
          title: i18n.tabs.leaderboard,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    maxWidth: 160,
  },
  switchButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
});
