import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HouseholdProvider } from '../src/context/HouseholdContext';
import { Colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <HouseholdProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerTitle: 'Housekeeping',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </HouseholdProvider>
  );
}
