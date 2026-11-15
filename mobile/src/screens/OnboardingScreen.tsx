import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { EnergyLevel } from '../types';

export interface OnboardingScreenProps {
  onComplete: (energy: EnergyLevel) => void;
  onNavigateAuth: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onNavigateAuth,
}) => {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('MEDIUM');
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const tenets = [
    {
      icon: '🧩',
      title: 'Bẻ nhỏ việc lớn thành bước <20p',
      desc: 'Trí tuệ nhân tạo Gemini giúp bạn phân rã những công việc phức tạp thành các hành động mồi nhỏ, bước 1 chỉ dưới 5 phút.',
    },
    {
      icon: '⚡',
      title: 'Chọn việc đúng mức năng lượng',
      desc: 'Lọc và làm những việc vừa sức với trạng thái não bộ hôm nay. Không ép buộc, không mặc cảm tội lỗi.',
    },
    {
      icon: '🎯',
      title: 'Đơn nhiệm tuyệt đối — 0 áp lực',
      desc: 'Cột Đang làm chỉ cho phép duy nhất 1 việc. Không có cảnh báo đỏ hoảng loạn, có Khiên Đóng Băng bảo vệ chuỗi ngày.',
    },
  ];

  const handleSelectEnergy = (energy: EnergyLevel) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEnergy(energy);
  };

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onComplete(selectedEnergy);
  };

  const energyOptions: Array<{ level: EnergyLevel; label: string; desc: string; color: string; bg: string }> = [
    {
      level: 'LOW',
      label: '☕ Thấp',
      desc: 'Não mệt, cần việc dễ',
      color: '#94A3B8',
      bg: 'rgba(148, 163, 184, 0.12)',
    },
    {
      level: 'MEDIUM',
      label: '⚡ Vừa',
      desc: 'Sẵn sàng việc vừa sức',
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.12)',
    },
    {
      level: 'HIGH',
      label: '🔥 Cao',
      desc: 'Hyperfocus sung sức',
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.12)',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandLogo}>🌌 ORBIT</Text>
          <Text style={styles.brandTagline}>Quỹ đạo bình yên cho tâm trí ADHD</Text>
        </View>

        {/* 3 Core Tenets Card */}
        <View style={styles.tenetCard}>
          <View style={styles.iconWrapper}>
            <Text style={styles.tenetIcon}>{tenets[activeSlide].icon}</Text>
          </View>
          <Text style={styles.tenetTitle}>{tenets[activeSlide].title}</Text>
          <Text style={styles.tenetDesc}>{tenets[activeSlide].desc}</Text>

          {/* Pagination Dots */}
          <View style={styles.paginationRow}>
            {tenets.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveSlide(idx)}
                style={[
                  styles.paginationDot,
                  activeSlide === idx && styles.paginationDotActive,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Chuyển đến trang giới thiệu ${idx + 1}`}
              />
            ))}
          </View>
        </View>

        {/* Initial Energy Calibration Section */}
        <View style={styles.energySection}>
          <Text style={styles.energyQuestion}>
            Hiện tại bạn đang cảm thấy năng lượng thế nào?
          </Text>

          <View style={styles.energyOptionsRow}>
            {energyOptions.map((opt) => {
              const isSelected = selectedEnergy === opt.level;
              return (
                <TouchableOpacity
                  key={opt.level}
                  style={[
                    styles.energyCard,
                    isSelected && { borderColor: opt.color, backgroundColor: opt.bg },
                  ]}
                  onPress={() => handleSelectEnergy(opt.level)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${opt.label}, ${opt.desc}`}
                >
                  <Text style={[styles.energyCardLabel, { color: isSelected ? opt.color : '#F8FAFC' }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.energyCardDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleStart}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Bắt đầu hành trình tập trung"
        >
          <Text style={styles.primaryBtnText}>
            BẮT ĐẦU HÀNH TRÌNH TẬP TRUNG 🚀
          </Text>
        </TouchableOpacity>

        {/* Secondary Auth Link */}
        <TouchableOpacity
          style={styles.authLinkBtn}
          onPress={onNavigateAuth}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Đăng nhập hoặc đăng ký tài khoản"
        >
          <Text style={styles.authLinkText}>
            Đã có tài khoản? <Text style={styles.authLinkHighlight}>Đăng nhập ngay</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    color: '#38BDF8',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  brandTagline: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tenetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tenetIcon: {
    fontSize: 32,
  },
  tenetTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  tenetDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  paginationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  paginationDotActive: {
    width: 22,
    backgroundColor: '#38BDF8',
  },
  energySection: {
    width: '100%',
    marginBottom: 28,
  },
  energyQuestion: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  energyOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  energyCard: {
    flex: 1,
    minHeight: 80,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  energyCardDesc: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  authLinkBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLinkText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  authLinkHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
