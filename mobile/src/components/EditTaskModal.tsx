import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../theme/colors';

interface TaskEditData {
  catalogTaskId: number;
  activeTaskId?: number | null;
  name: string;
  frequencyDays: number;
  lastDoneDate?: string | null;
  isCustom: boolean;
}

interface EditTaskModalProps {
  visible: boolean;
  taskData: TaskEditData | null;
  onClose: () => void;
  onSave: (data: { catalogTaskId: number; activeTaskId?: number | null; name: string; frequencyDays: number; lastDoneDate?: string }) => Promise<void>;
  onDelete?: (catalogTaskId: number) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ visible, taskData, onClose, onSave, onDelete }) => {
  const [name, setName] = useState<string>('');
  const [frequencyDaysInput, setFrequencyDaysInput] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (taskData) {
      setName(taskData.name);
      setFrequencyDaysInput(taskData.frequencyDays.toString());
      if (taskData.lastDoneDate) {
        const parts = taskData.lastDoneDate.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          setSelectedDate(new Date(year, month, day));
        } else {
          setSelectedDate(new Date());
        }
      } else {
        setSelectedDate(null);
      }
    }
  }, [taskData]);

  if (!taskData) return null;

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setSelectedDate(date);
    }
  };

  const handleSetQuickDate = (type: 'TODAY' | 'YESTERDAY' | 'CLEAR') => {
    if (type === 'CLEAR') {
      setSelectedDate(null);
      return;
    }
    const d = new Date();
    if (type === 'YESTERDAY') {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  };

  const formatDateString = (d: Date | null): string => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Task name cannot be empty.');
      return;
    }

    const freqParsed = parseInt(frequencyDaysInput.trim(), 10);
    if (isNaN(freqParsed) || freqParsed <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive number of days for frequency.');
      return;
    }

    const dateStr = formatDateString(selectedDate);

    try {
      setSubmitting(true);
      await onSave({
        catalogTaskId: taskData.catalogTaskId,
        activeTaskId: taskData.activeTaskId,
        name: trimmedName,
        frequencyDays: freqParsed,
        lastDoneDate: dateStr || undefined,
      });
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to update task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskData.name}" from catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await onDelete(taskData.catalogTaskId);
              onClose();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete task.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Edit Task</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Task name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Frequency (Days)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={frequencyDaysInput}
              onChangeText={setFrequencyDaysInput}
              placeholder="e.g. 14"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Date Last Done</Text>

            {/* Interactive Date Picker Trigger Button */}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
              <Text style={styles.datePickerButtonText}>
                {selectedDate ? formatDateString(selectedDate) : 'Select Last Done Date'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickDateRow}>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => handleSetQuickDate('TODAY')}>
                <Text style={styles.quickDateText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => handleSetQuickDate('YESTERDAY')}>
                <Text style={styles.quickDateText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => handleSetQuickDate('CLEAR')}>
                <Text style={styles.quickDateText}>Clear Date</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
                onDismiss={() => setShowDatePicker(false)}
              />
            )}

            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={submitting}
            >
              <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>

            {taskData.isCustom && onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={submitting}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.deleteBtnText}>Delete Custom Task</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  datePickerButtonText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  quickDateChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickDateText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
