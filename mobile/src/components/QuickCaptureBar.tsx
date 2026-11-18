import { useEnergyLabels, useLocale } from '../ui/locale';
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
import { colors } from '../ui/theme';

interface QuickCaptureBarProps {
  onAddTask: (title: string, energy: EnergyLevel, description?: string) => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({ onAddTask }) => {
  const t = useLocale();
  const energyLabels = useEnergyLabels();
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

  const handleSend = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    onAddTask(trimmed, selectedEnergy);
    setTitle('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.energyCycleBtn}
          onPress={cycleEnergy}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${t("Đổi mức năng lượng", "Change energy")} · ${energyLabels[selectedEnergy]}`}
        >
          <Text style={styles.energyCycleText}>
            {energyLabels[selectedEnergy]}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={t('Tên việc')}
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSend}
          returnKeyType="done"
          accessible={true}
          accessibilityLabel={t("Nhập tiêu đề công việc mới", "Enter a new task name")}
        />

        <TouchableOpacity
          style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
          onPress={handleSend}
          disabled={!title.trim()}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("Thêm nhiệm vụ", "Capture task")}
        >
          <Text style={[styles.addButtonText, !title.trim() && styles.disabledLabel]}>{t("Ghi", "Add")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    minWidth: 44,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyCycleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.outline,
    minHeight: 44,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.surface,
  },
  disabledLabel: { color: colors.muted },
  addButtonText: {
    color: colors.accentInk,
    fontSize: 13,
    fontWeight: '700',
  },
});
