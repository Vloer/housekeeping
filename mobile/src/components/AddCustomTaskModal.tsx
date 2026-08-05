import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface AddCustomTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, frequencyDays: number) => Promise<void>;
}

const FREQUENCY_OPTIONS = [
  { label: 'Weekly (7d)', days: 7 },
  { label: 'Bi-Weekly (14d)', days: 14 },
  { label: 'Monthly (30d)', days: 30 },
  { label: 'Quarterly (90d)', days: 90 },
  { label: 'Yearly (365d)', days: 365 },
];

export const AddCustomTaskModal: React.FC<AddCustomTaskModalProps> = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(14);
  const [customDaysInput, setCustomDaysInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a task name.');
      return;
    }

    let days = selectedDays;
    if (customDaysInput.trim()) {
      const parsed = parseInt(customDaysInput.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid positive number for frequency days.');
        return;
      }
      days = parsed;
    }

    try {
      setSubmitting(true);
      await onAdd(trimmedName, days);
      setName('');
      setCustomDaysInput('');
      setSelectedDays(14);
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to add custom task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Add Custom Task</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Task Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Clean air filters"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Frequency</Text>
            <View style={styles.freqOptions}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.freqChip, selectedDays === opt.days && !customDaysInput && styles.freqChipActive]}
                  onPress={() => {
                    setSelectedDays(opt.days);
                    setCustomDaysInput('');
                  }}
                >
                  <Text style={[styles.freqChipText, selectedDays === opt.days && !customDaysInput && styles.freqChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Or Custom Days</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 45"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={customDaysInput}
              onChangeText={setCustomDaysInput}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleAdd}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Adding...' : 'Add to Catalog'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  freqChip: {
    backgroundColor: Colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  freqChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  freqChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
