import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { EnergyLevel } from '../types';

interface QuickCaptureBarProps {
  onAddTask: (title: string, energy: EnergyLevel) => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('MEDIUM');

  const cycleEnergy = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEnergy((prev) => {
      if (prev === 'LOW') return 'MEDIUM';
      if (prev === 'MEDIUM') return 'HIGH';
      return 'LOW';
    });
  };

  const getEnergyConfig = (level: EnergyLevel) => {
    switch (level) {
      case 'LOW':
        return { label: '☕ Thấp', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'HIGH':
        return { label: '🔥 Cao', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' };
      case 'MEDIUM':
      default:
        return { label: '⚡ Vừa', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
  };

  const energyInfo = getEnergyConfig(selectedEnergy);

  const handleSend = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onAddTask(trimmed, selectedEnergy);
    setTitle('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.energyCycleBtn, { backgroundColor: energyInfo.bg, borderColor: energyInfo.color }]}
          onPress={cycleEnergy}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Mức năng lượng: ${energyInfo.label}. Nhấn để đổi`}
        >
          <Text style={[styles.energyCycleText, { color: energyInfo.color }]}>
            {energyInfo.label}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Thêm việc mới..."
          placeholderTextColor="#64748B"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSend}
          returnKeyType="done"
          accessible={true}
          accessibilityLabel="Nhập tiêu đề công việc mới vào Backlog"
        />

        <TouchableOpacity
          style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
          onPress={handleSend}
          disabled={!title.trim()}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Thêm nhiệm vụ vào Backlog"
        >
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  energyCycleBtn: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyCycleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 44,
  },
  addButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
