import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { HouseholdProvider } from '../src/context/HouseholdContext';
import { Colors } from '../src/theme/colors';
import i18n, { LanguageProvider } from '../src/i18n';

export default function RootLayout() {
    useEffect(() => {
        async function onFetchUpdateAsync() {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          } catch (error) {
            console.log(`Error fetching latest update: ${error}`);
          }
        }

        onFetchUpdateAsync();
      }, []);

  return (
    <LanguageProvider>
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
              headerTitle: i18n.appName,
              headerBackVisible: false,
              gestureEnabled: false,
            }}
          />
        </Stack>
      </HouseholdProvider>
    </LanguageProvider>
  );
}