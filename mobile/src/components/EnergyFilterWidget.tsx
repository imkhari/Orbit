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

      {/* Energy Quick-Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterSectionTitle}>Năng lượng nhận thức hiện tại:</Text>
          {selectedEnergy !== 'ALL' && (
            <TouchableOpacity
              onPress={() => handleSelect('ALL')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetFilterText}>Xóa lọc</Text>
            </TouchableOpacity>
          )}
        </View>

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
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                    isSelected && { color: opt.activeColor },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
  filterSection: {
    gap: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  resetBtn: {
    minHeight: 24,
    justifyContent: 'center',
  },
  resetFilterText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 44, // WCAG Touch target >= 44x44 pt
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  chipSelected: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
});
