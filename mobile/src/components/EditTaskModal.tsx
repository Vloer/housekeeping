import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { BaseModal } from './common/BaseModal';
import { Colors } from '../theme/colors';
import { FREQUENCY_PRESETS } from '../types';
import { formatDate } from '../utils/dateUtils';

interface EditTaskData {
  catalogTaskId: number;
  activeTaskId?: number | null;
  isActive?: boolean;
  name: string;
  frequencyDays: number;
  lastDoneDate?: string | null;
  isCustom?: boolean;
}

interface EditTaskModalProps {
  visible: boolean;
  taskData: EditTaskData | null;
  onClose: () => void;
  onSave: (data: {
    catalogTaskId: number;
    activeTaskId?: number | null;
    name: string;
    frequencyDays: number;
    lastDoneDate?: string;
  }) => Promise<void>;
  onDelete?: (catalogTaskId: number) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  visible,
  taskData,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskData) {
      setName(taskData.name);
      const isPreset = FREQUENCY_PRESETS.some((opt) => opt.days === taskData.frequencyDays);
      if (isPreset) {
        setFrequencyDays(taskData.frequencyDays);
        setCustomDaysInput('');
      } else {
        setFrequencyDays(0);
        setCustomDaysInput(taskData.frequencyDays.toString());
      }
      if (taskData.lastDoneDate) {
        setSelectedDate(new Date(taskData.lastDoneDate));
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [taskData]);

  if (!taskData) return null;

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSelectedDate(d);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Task name cannot be empty.');
      return;
    }

    let finalFreq = frequencyDays;
    if (customDaysInput) {
      const parsed = parseInt(customDaysInput, 10);
      if (isNaN(parsed) || parsed <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid number of days.');
        return;
      }
      finalFreq = parsed;
    }

    try {
      setLoading(true);
      const formattedDate = formatDate(selectedDate);
      await onSave({
        catalogTaskId: taskData.catalogTaskId,
        activeTaskId: taskData.activeTaskId,
        name: trimmedName,
        frequencyDays: finalFreq,
        lastDoneDate: formattedDate,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete || !taskData.isCustom) return;
    Alert.alert(
      'Delete Task',
      `Are you sure you want to permanently delete "${taskData.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDelete(taskData.catalogTaskId);
            onClose();
          },
        },
      ]
    );
  };

  const isTaskActive = taskData.isActive || !!taskData.activeTaskId || taskData.lastDoneDate !== undefined;

  return (
    <BaseModal visible={visible} title="Edit Task" onClose={onClose}>
      <Text style={styles.label}>Task Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        editable={taskData.isCustom}
      />

      <Text style={styles.label}>Repeat Frequency</Text>
      <View style={styles.chipRow}>
        {FREQUENCY_PRESETS.map((option) => {
          const isSelected = frequencyDays === option.days && !customDaysInput;
          return (
            <TouchableOpacity
              key={option.label}
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

      <Text style={styles.sublabel}>Or enter custom number of days:</Text>
      <TextInput
        style={styles.input}
        placeholder="Custom days (e.g. 45)"
        keyboardType="numeric"
        value={customDaysInput}
        onChangeText={setCustomDaysInput}
      />

      {isTaskActive && (
        <View style={styles.dateSection}>
          <Text style={styles.label}>Last Done Date</Text>
          
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSetQuickDate(0)}
            >
              <Text style={styles.quickChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSetQuickDate(1)}
            >
              <Text style={styles.quickChipText}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickChip}
              onPress={() => handleSetQuickDate(2)}
            >
              <Text style={styles.quickChipText}>2 days ago</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.datePickerTrigger}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.datePickerText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>

      {taskData.isCustom && onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Custom Task</Text>
        </TouchableOpacity>
      )}
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
  dateSection: {
    marginBottom: 10,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  quickChip: {
    backgroundColor: Colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.background,
  },
  datePickerText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 12,
    padding: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
