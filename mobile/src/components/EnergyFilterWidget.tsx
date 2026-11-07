import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { EnergyLevel } from '../types';

export type EnergyFilterType = 'ALL' | EnergyLevel;

interface EnergyFilterWidgetProps {
  selectedEnergy: EnergyFilterType;
  onSelectEnergy: (energy: EnergyFilterType) => void;
  streakDays?: number;
  freezeCount?: number;
  showStreakCard?: boolean;
}

export const EnergyFilterWidget: React.FC<EnergyFilterWidgetProps> = ({
  selectedEnergy,
  onSelectEnergy,
  streakDays = 5,
  freezeCount = 2,
  showStreakCard = false,
}) => {
  const filterOptions: Array<{ id: EnergyFilterType; label: string; activeColor: string }> = [
    { id: 'ALL', label: 'Tất cả', activeColor: '#38BDF8' },
    { id: 'LOW', label: '☕ Thấp', activeColor: '#94A3B8' },
    { id: 'MEDIUM', label: '⚡ Vừa', activeColor: '#FBBF24' },
    { id: 'HIGH', label: '🔥 Cao', activeColor: '#F87171' },
  ];

  const handleSelect = (energy: EnergyFilterType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectEnergy(energy);
  };

  return (
    <View style={styles.container}>
      {showStreakCard && (
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>
                Chuỗi tập trung: <Text style={styles.streakNumber}>{streakDays} ngày</Text>
              </Text>
              <Text style={styles.streakSubtitle}>
                Mỗi bước nhỏ đều tạo nên bước nhảy lớn
              </Text>
            </View>
          </View>

          <View style={styles.freezeBadge}>
            <Text style={styles.freezeBadgeText}>
              🛡️ {freezeCount} Khiên Đóng Băng
            </Text>
            <Text style={styles.freezeSubtext}>
              Nghỉ ngơi không mất chuỗi
            </Text>
          </View>
        </View>
      )}

      {/* Energy Quick-Filter Bar - Clean Segmented Style */}
      <View style={styles.chipsRow}>
        {filterOptions.map((opt) => {
          const isSelected = selectedEnergy === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isSelected && { borderColor: opt.activeColor },
              ]}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Lọc theo mức năng lượng: ${opt.label}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isSelected && { color: opt.activeColor },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#0F172A',
  },
  streakCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 10,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakIcon: {
    fontSize: 24,
  },
  streakTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  streakNumber: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  streakSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  freezeBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freezeBadgeText: {
    color: '#818CF8', // Gentle Streak Freeze Shield token
    fontSize: 11,
    fontWeight: '700',
  },
  freezeSubtext: {
    color: '#94A3B8',
    fontSize: 10,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    minHeight: 40, // Touch target >= 40pt
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chipSelected: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
});
