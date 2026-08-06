import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage, LanguageCode } from '../i18n';
import { Colors } from '../theme/colors';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.segment, language === 'EN' && styles.activeSegment]}
        onPress={() => setLanguage('EN')}
        activeOpacity={0.8}
        accessibilityLabel="Select English Language"
        accessibilityRole="button"
      >
        <Text style={[styles.text, language === 'EN' && styles.activeText]}>EN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segment, language === 'NL' && styles.activeSegment]}
        onPress={() => setLanguage('NL')}
        activeOpacity={0.8}
        accessibilityLabel="Select Dutch Language"
        accessibilityRole="button"
      >
        <Text style={[styles.text, language === 'NL' && styles.activeText]}>NL</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  segment: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeSegment: {
    backgroundColor: Colors.primary,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeText: {
    color: '#FFFFFF',
  },
});
