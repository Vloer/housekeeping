import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { BaseModal } from './common/BaseModal';
import { Colors } from '../theme/colors';
import { getFrequencyPresets } from '../types';
import { useLanguage } from '../i18n';

interface AddCustomTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, frequencyDays: number) => Promise<void>;
}

export const AddCustomTaskModal: React.FC<AddCustomTaskModalProps> = ({ visible, onClose, onAdd }) => {
  const { i18n } = useLanguage();
  const presets = getFrequencyPresets(i18n);
  const [name, setName] = useState('');
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(i18n.onboarding.validationError, i18n.modals.addCustomTask.pleaseEnterTaskName);
      return;
    }

    let finalFreq = frequencyDays;
    if (customDaysInput) {
      const parsed = parseInt(customDaysInput, 10);
      if (isNaN(parsed) || parsed <= 0) {
        Alert.alert(i18n.onboarding.validationError, i18n.modals.addCustomTask.pleaseEnterValidDays);
        return;
      }
      finalFreq = parsed;
    }

    try {
      setLoading(true);
      await onAdd(trimmedName, finalFreq);
      setName('');
      setCustomDaysInput('');
      setFrequencyDays(30);
      onClose();
    } catch (err) {
      Alert.alert(i18n.onboarding.errorTitle, i18n.modals.addCustomTask.failedToCreateTask);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} title={i18n.modals.addCustomTask.title} onClose={onClose}>
      <Text style={styles.label}>{i18n.modals.addCustomTask.taskNameLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={i18n.modals.addCustomTask.taskNamePlaceholder}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={styles.label}>{i18n.modals.addCustomTask.repeatFrequencyLabel}</Text>
      <View style={styles.chipRow}>
        {presets.map((option) => {
          const isSelected = frequencyDays === option.days && !customDaysInput;
          return (
            <TouchableOpacity
              key={option.days}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                setFrequencyDays(option.days);
                setCustomDaysInput('');
              }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sublabel}>{i18n.modals.addCustomTask.customDaysLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={i18n.modals.addCustomTask.customDaysPlaceholder}
        keyboardType="numeric"
        value={customDaysInput}
        onChangeText={setCustomDaysInput}
      />

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? i18n.modals.addCustomTask.creatingButton : i18n.modals.addCustomTask.createButton}
        </Text>
      </TouchableOpacity>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 2,
  },
  sublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
