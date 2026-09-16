import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { EnergyLevel } from '../types';

interface QuickCaptureBarProps {
  onAddTask: (title: string, energy: EnergyLevel) => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('MEDIUM');

  const handleSend = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddTask(trimmed, selectedEnergy);
    setTitle('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Energy Quick Selector Pills */}
      <View style={styles.energySelectorRow}>
        <Text style={styles.selectorHint}>Energy:</Text>
        <TouchableOpacity
          style={[
            styles.energyOption,
            selectedEnergy === 'LOW' && styles.energySelectedLow,
          ]}
          onPress={() => setSelectedEnergy('LOW')}
          activeOpacity={0.7}
        >
          <Text style={styles.energyOptionText}>☕ Low</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.energyOption,
            selectedEnergy === 'MEDIUM' && styles.energySelectedMed,
          ]}
          onPress={() => setSelectedEnergy('MEDIUM')}
          activeOpacity={0.7}
        >
          <Text style={styles.energyOptionText}>⚡ Med</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.energyOption,
            selectedEnergy === 'HIGH' && styles.energySelectedHigh,
          ]}
          onPress={() => setSelectedEnergy('HIGH')}
          activeOpacity={0.7}
        >
          <Text style={styles.energyOptionText}>🔥 High</Text>
        </TouchableOpacity>
      </View>

      {/* Input bar and send action */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Thêm nhanh việc mới vào Backlog..."
          placeholderTextColor="#64748B"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSend}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
          onPress={handleSend}
          disabled={!title.trim()}
          activeOpacity={0.8}
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  energySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  selectorHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 2,
  },
  energyOption: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  energyOptionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  energySelectedLow: {
    backgroundColor: 'rgba(148, 163, 184, 0.25)',
    borderColor: '#94A3B8',
  },
  energySelectedMed: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderColor: '#FBBF24',
  },
  energySelectedHigh: {
    backgroundColor: 'rgba(248, 113, 113, 0.25)',
    borderColor: '#F87171',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 10,
    minHeight: 44,
  },
  addButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#334155',
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
});
