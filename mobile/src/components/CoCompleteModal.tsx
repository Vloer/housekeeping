import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveTask, HighscoreEntry } from '../types';
import { Colors } from '../theme/colors';
import { useLanguage } from '../i18n';

interface CoCompleteModalProps {
  visible: boolean;
  task: ActiveTask | null;
  householdMembers: HighscoreEntry[];
  currentUserUuid: string;
  currentUserName: string;
  onClose: () => void;
  onConfirm: (selectedUuids: string[]) => void;
}

export const CoCompleteModal: React.FC<CoCompleteModalProps> = ({
  visible,
  task,
  householdMembers,
  currentUserUuid,
  currentUserName,
  onClose,
  onConfirm,
}) => {
  const { getTaskName } = useLanguage();
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      // Pre-select current user by default
      if (currentUserUuid) {
        setSelectedUuids([currentUserUuid]);
      } else {
        setSelectedUuids([]);
      }
    }
  }, [visible, currentUserUuid]);

  if (!task) return null;

  const taskName = getTaskName(task.task_name);
  const totalPoints = task.frequency_days;

  // Build unified member list ensuring current user is present
  const memberList: HighscoreEntry[] = [...householdMembers];
  if (currentUserUuid && !memberList.some((m) => m.user_uuid === currentUserUuid)) {
    memberList.unshift({
      rank: 0,
      user_uuid: currentUserUuid,
      username: currentUserName || 'You',
      points: 0,
    });
  }

  const toggleUser = (uuid: string) => {
    setSelectedUuids((prev) => {
      if (prev.includes(uuid)) {
        if (prev.length <= 1) {
          // Keep at least 1 person selected
          return prev;
        }
        return prev.filter((u) => u !== uuid);
      } else {
        return [...prev, uuid];
      }
    });
  };

  const participantCount = Math.max(1, selectedUuids.length);
  const pointsPerPerson = Math.ceil(totalPoints / participantCount);

  const handleConfirm = () => {
    if (selectedUuids.length === 0) return;
    onConfirm(selectedUuids);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="people" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Co-Complete Task</Text>
                <Text style={styles.taskSubTitle} numberOfLines={1}>{taskName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.instructionText}>
            Select household members who helped complete this chore together:
          </Text>

          <FlatList
            data={memberList}
            keyExtractor={(item) => item.user_uuid}
            style={styles.memberList}
            renderItem={({ item }) => {
              const isSelected = selectedUuids.includes(item.user_uuid);
              const isSelf = item.user_uuid === currentUserUuid;
              const displayName = isSelf ? `${item.username} (You)` : item.username;
              const initial = (item.username || '?').charAt(0).toUpperCase();

              return (
                <TouchableOpacity
                  style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => toggleUser(item.user_uuid)}
                >
                  <View style={[styles.avatarCircle, isSelected && styles.avatarCircleSelected]}>
                    <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                      {initial}
                    </Text>
                  </View>

                  <Text style={[styles.memberName, isSelected && styles.memberNameSelected]}>
                    {displayName}
                  </Text>

                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.footer}>
            <View style={styles.pointsSummaryCard}>
              <View style={styles.pointsRow}>
                <Ionicons name="star" size={18} color={Colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.pointsSummaryText}>
                  <Text style={styles.pointsHighlight}>+{pointsPerPerson} pts</Text> each
                </Text>
              </View>
              <Text style={styles.splitDetailText}>
                {totalPoints} total pts split between {participantCount} {participantCount === 1 ? 'person' : 'people'} (rounded up)
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, selectedUuids.length === 0 && styles.disabledButton]}
                onPress={handleConfirm}
                activeOpacity={0.8}
                disabled={selectedUuids.length === 0}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmButtonText}>Complete Together</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  taskSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    fontWeight: '500',
  },
  memberList: {
    maxHeight: 220,
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSoft,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberRowSelected: {
    backgroundColor: Colors.secondarySoft,
    borderColor: 'rgba(42, 157, 143, 0.4)',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarCircleSelected: {
    backgroundColor: Colors.secondary,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  memberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  memberNameSelected: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  footer: {
    gap: 12,
  },
  pointsSummaryCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsSummaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  pointsHighlight: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.accent,
  },
  splitDetailText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
