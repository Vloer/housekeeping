import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHousehold } from '../src/context/HouseholdContext';
import { Household } from '../src/types';
import { Colors } from '../src/theme/colors';

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    userName,
    recentHouseholds,
    checkJoinHousehold,
    createHousehold,
    joinHousehold,
    connectRecentHousehold,
    removeRecentHousehold,
  } = useHousehold();

  const [mode, setMode] = useState<'JOIN' | 'CREATE'>('JOIN');
  const [householdName, setHouseholdName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>(userName || '');
  const [showNameStep, setShowNameStep] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleConnectRecent = async (h: Household) => {
    try {
      setLoading(true);
      await connectRecentHousehold(h);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to connect to recent household.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecent = (h: Household) => {
    Alert.alert(
      'Remove Household',
      `Remove "${h.name}" from your recent list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeRecentHousehold(h.household_id),
        },
      ]
    );
  };

  const handleJoinPress = async () => {
    const trimmedCode = joinCode.trim().toUpperCase();
    if (!trimmedCode) {
      Alert.alert('Validation Error', 'Please enter a valid join code (e.g. HK-ABCD).');
      return;
    }

    try {
      setLoading(true);
      const check = await checkJoinHousehold(trimmedCode);
      if (check.is_member && check.existing_username) {
        // User already joined this household previously -> automatic rejoin!
        await joinHousehold(trimmedCode, check.existing_username);
        router.replace('/(tabs)');
      } else {
        // First time joining THIS household -> prompt for username in this household
        setShowNameStep(true);
        if (!nameInput && userName) {
          setNameInput(userName);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Household not found. Check join code.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoinNew = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter your name for this household.');
      return;
    }

    try {
      setLoading(true);
      await joinHousehold(joinCode.trim().toUpperCase(), trimmedName);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to join household.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    const trimmedHName = householdName.trim();
    if (!trimmedHName) {
      Alert.alert('Validation Error', 'Please enter a household name.');
      return;
    }

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter your name for this household.');
      return;
    }

    try {
      setLoading(true);
      await createHousehold(trimmedHName, trimmedName);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create household.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerIcon}>
          <Ionicons name="home" size={48} color={Colors.primaryLight} />
        </View>
        <Text style={styles.title}>Household Setup</Text>

        {/* Previously Connected Households Section */}
        {recentHouseholds.length > 0 && (
          <View style={styles.recentsContainer}>
            <Text style={styles.sectionTitle}>Your Connected Households</Text>
            {recentHouseholds.map((h) => (
              <View key={h.household_id} style={styles.recentCard}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{h.name}</Text>
                  <Text style={styles.recentSubtext}>
                    Code: <Text style={styles.codeText}>{h.join_code}</Text> • As <Text style={styles.userText}>{h.username}</Text>
                  </Text>
                </View>

                <View style={styles.recentActions}>
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => handleConnectRecent(h)}
                    disabled={loading}
                  >
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveRecent(h)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.subtitle}>
          {recentHouseholds.length > 0 ? 'Or connect to a new household:' : 'Join an existing household or create a new one.'}
        </Text>

        {!showNameStep && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'JOIN' && styles.tabActive]}
              onPress={() => {
                setMode('JOIN');
                setShowNameStep(false);
              }}
            >
              <Text style={[styles.tabText, mode === 'JOIN' && styles.tabTextActive]}>Join Household</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'CREATE' && styles.tabActive]}
              onPress={() => {
                setMode('CREATE');
                setShowNameStep(false);
              }}
            >
              <Text style={[styles.tabText, mode === 'CREATE' && styles.tabTextActive]}>Create New</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.form}>
          {mode === 'CREATE' ? (
            <>
              <Text style={styles.label}>Household Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cozy Cottage"
                placeholderTextColor={Colors.textMuted}
                value={householdName}
                onChangeText={setHouseholdName}
              />

              <Text style={styles.label}>Your Name in this Household</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex"
                placeholderTextColor={Colors.textMuted}
                value={nameInput}
                onChangeText={setNameInput}
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleCreateSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating...' : 'Create Household'}
                </Text>
              </TouchableOpacity>
            </>
          ) : showNameStep ? (
            <>
              <View style={styles.infoBox}>
                <Ionicons name="sparkles" size={20} color={Colors.accent} />
                <Text style={styles.infoBoxText}>First time joining this household!</Text>
              </View>

              <Text style={styles.label}>Your Name in this Household</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex"
                placeholderTextColor={Colors.textMuted}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleConfirmJoinNew}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Joining...' : 'Confirm & Join'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowNameStep(false)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Join Code</Text>
              <TextInput
                style={[styles.input, styles.joinCodeInput]}
                placeholder="HK-XXXX"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                value={joinCode}
                onChangeText={setJoinCode}
              />

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleJoinPress}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Checking...' : 'Join Household'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  recentsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentInfo: {
    flex: 1,
    marginRight: 10,
  },
  recentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  recentSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  codeText: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  userText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  connectBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  form: {
    width: '100%',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 8,
  },
  infoBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  joinCodeInput: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
