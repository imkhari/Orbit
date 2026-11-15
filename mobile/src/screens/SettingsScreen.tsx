import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { EnergyLevel, SoundscapeType } from '../types';

export interface SettingsScreenProps {
  onBack: () => void;
  onNavigateAuth?: () => void;
}

const SOUNDSCAPE_OPTIONS: Array<{
  type: SoundscapeType;
  label: string;
  icon: string;
  desc: string;
}> = [
  { type: 'NONE', label: 'Tắt', icon: '🔇', desc: 'Im lặng hoàn toàn' },
  { type: 'BROWN_NOISE', label: 'Tiếng Ồn Nâu', icon: '🎧', desc: 'Tần số trầm sâu, lọc tạp âm xao nhãng' },
  { type: 'RAIN', label: 'Mưa Rào', icon: '🌧️', desc: 'Tiếng mưa êm dịu, tăng nhịp Alpha' },
  { type: 'FOREST', label: 'Rừng Thông', icon: '🌲', desc: 'Gió nhẹ và tiếng thiên nhiên thư thái' },
  { type: 'WAVES', label: 'Sóng Biển', icon: '🌊', desc: 'Nhịp sóng vỗ đều đặn hỗ trợ nhịp thở' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onNavigateAuth,
}) => {
  const { user, logout, setEnergyLevel } = useAuthStore();
  const { streak } = useTaskStore();
  const {
    defaultEnergyLevel,
    pomodoroMinutes,
    soundscape,
    isSoundscapePlaying,
    hapticFeedbackEnabled,
    gentleNotificationsEnabled,
    hideRedAlerts,
    setDefaultEnergyLevel,
    setPomodoroMinutes,
    setSoundscape,
    toggleSoundscapePlaying,
    toggleHapticFeedback,
    toggleGentleNotifications,
    toggleHideRedAlerts,
  } = useSettingsStore();

  // State chỉnh sửa tên hiển thị
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.displayName || 'ADHD Explorer');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticFeedbackEnabled && Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleSelectEnergy = (energy: EnergyLevel) => {
    triggerHaptic();
    setDefaultEnergyLevel(energy);
    setEnergyLevel(energy);
  };

  const handleSelectPomodoro = (minutes: 15 | 25 | 45) => {
    triggerHaptic();
    setPomodoroMinutes(minutes);
  };

  const handleSelectSoundscape = async (type: SoundscapeType) => {
    triggerHaptic();
    await setSoundscape(type);
  };

  const handleLogout = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Đăng Xuất Khỏi Orbit?',
      'Dữ liệu công việc của bạn vẫn được lưu trữ an toàn trên đám mây. Bạn có thể đăng nhập lại bất kỳ lúc nào 🌿',
      [
        { text: 'Ở Lại', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: () => {
            logout();
            onNavigateAuth ? onNavigateAuth() : onBack();
          },
        },
      ]
    );
  };

  const getLevelTitle = (lvl: number = 1): string => {
    if (lvl <= 1) return 'Người Du Hành Cấp 1 🚀';
    if (lvl <= 3) return `Chiến Binh Tập Trung Cấp ${lvl} ⚡`;
    if (lvl <= 5) return `Bậc Thầy Chánh Niệm Cấp ${lvl} 🌿`;
    return `Chúa Tể Không Gian Cấp ${lvl} 🌌`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Quay lại màn hình trước"
        >
          <Text style={styles.backBtnText}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài Đặt Hồ Sơ & Năng Lượng</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👨‍💻</Text>
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.displayName || 'ADHD Explorer'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditedName(user?.displayName || 'ADHD Explorer');
                  setIsEditingName(true);
                }}
                style={styles.editNameBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Đổi tên hiển thị"
              >
                <Text style={styles.editNameIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userEmail}>{user?.email || 'demo@orbit.app'}</Text>
            <View style={styles.userLevelBadge}>
              <Text style={styles.userLevelText}>{getLevelTitle(streak?.currentLevel || 1)}</Text>
            </View>
          </View>
        </View>

        {/* Gentle Streak & Freeze Shield Card (Frame_08) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>CHUỖI ĐỘNG LỰC DỊU DÀNG (GENTLE STREAK)</Text>
          <View style={styles.streakCard}>
            <View style={styles.streakTopRow}>
              <View style={styles.streakPill}>
                <Text style={styles.streakFireIcon}>🔥</Text>
                <Text style={styles.streakCountText}>{streak?.currentStreak || 5} Ngày Liên Tiếp</Text>
              </View>
              <View style={styles.shieldPill}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <Text style={styles.shieldCountText}>{streak?.freezeCredits ?? 2} Khiên Sẵn Sàng</Text>
              </View>
            </View>
            <Text style={styles.streakMessage}>
              "{streak?.gentleMessage ||
                'Bạn đã duy trì rất cừ! Nếu mai bạn mệt, Orbit sẽ tự động kích hoạt lượt đóng băng để bảo toàn chuỗi mà không gây áp lực 🌿'}"
            </Text>
          </View>
        </View>

        {/* Cognitive & Biological Tuning */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>CẤU HÌNH NHỊP SINH HỌC & TẬP TRUNG</Text>

          {/* Default Energy Selector */}
          <Text style={styles.subHeader}>Mức năng lượng mặc định khi mở app:</Text>
          <View style={styles.energySelectorRow}>
            <TouchableOpacity
              style={[
                styles.energyChoiceBtn,
                defaultEnergyLevel === 'LOW' && styles.energyChoiceBtnSelected,
              ]}
              onPress={() => handleSelectEnergy('LOW')}
              activeOpacity={0.8}
            >
              <Text style={styles.energyChoiceEmoji}>☕</Text>
              <Text
                style={[
                  styles.energyChoiceLabel,
                  defaultEnergyLevel === 'LOW' && styles.energyChoiceLabelSelected,
                ]}
              >
                Thấp (Êm ái)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.energyChoiceBtn,
                defaultEnergyLevel === 'MEDIUM' && styles.energyChoiceBtnSelected,
              ]}
              onPress={() => handleSelectEnergy('MEDIUM')}
              activeOpacity={0.8}
            >
              <Text style={styles.energyChoiceEmoji}>⚡</Text>
              <Text
                style={[
                  styles.energyChoiceLabel,
                  defaultEnergyLevel === 'MEDIUM' && styles.energyChoiceLabelSelected,
                ]}
              >
                Vừa (Tiêu chuẩn)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.energyChoiceBtn,
                defaultEnergyLevel === 'HIGH' && styles.energyChoiceBtnSelected,
              ]}
              onPress={() => handleSelectEnergy('HIGH')}
              activeOpacity={0.8}
            >
              <Text style={styles.energyChoiceEmoji}>🔥</Text>
              <Text
                style={[
                  styles.energyChoiceLabel,
                  defaultEnergyLevel === 'HIGH' && styles.energyChoiceLabelSelected,
                ]}
              >
                Cao (Sẵn sàng)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pomodoro Duration Choice */}
          <Text style={[styles.subHeader, { marginTop: 18 }]}>Thời lượng Pomodoro phù hợp với bạn:</Text>
          <View style={styles.pomodoroList}>
            <TouchableOpacity
              style={[
                styles.pomodoroOptionCard,
                pomodoroMinutes === 15 && styles.pomodoroOptionCardActive,
              ]}
              onPress={() => handleSelectPomodoro(15)}
              activeOpacity={0.8}
            >
              <View style={styles.radioCircle}>
                {pomodoroMinutes === 15 && <View style={styles.radioInnerCircle} />}
              </View>
              <View style={styles.pomodoroOptionInfo}>
                <Text style={styles.pomodoroOptionTitle}>☕ 15 phút</Text>
                <Text style={styles.pomodoroOptionDesc}>Khuyên dùng khi não mệt, dễ bị tê liệt hành động</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pomodoroOptionCard,
                pomodoroMinutes === 25 && styles.pomodoroOptionCardActive,
              ]}
              onPress={() => handleSelectPomodoro(25)}
              activeOpacity={0.8}
            >
              <View style={styles.radioCircle}>
                {pomodoroMinutes === 25 && <View style={styles.radioInnerCircle} />}
              </View>
              <View style={styles.pomodoroOptionInfo}>
                <Text style={styles.pomodoroOptionTitle}>⚡ 25 phút (Tiêu chuẩn)</Text>
                <Text style={styles.pomodoroOptionDesc}>Nhịp độ kinh điển giúp duy trì động lực bền vững</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pomodoroOptionCard,
                pomodoroMinutes === 45 && styles.pomodoroOptionCardActive,
              ]}
              onPress={() => handleSelectPomodoro(45)}
              activeOpacity={0.8}
            >
              <View style={styles.radioCircle}>
                {pomodoroMinutes === 45 && <View style={styles.radioInnerCircle} />}
              </View>
              <View style={styles.pomodoroOptionInfo}>
                <Text style={styles.pomodoroOptionTitle}>🔥 45 phút (Hyperfocus)</Text>
                <Text style={styles.pomodoroOptionDesc}>Dành cho phiên tập trung sâu khi bạn đã vào nhịp flow</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cognitive Soundscapes Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.soundscapeHeaderRow}>
            <Text style={styles.sectionHeader}>ÂM THANH TRỢ NĂNG NHẬN THỨC</Text>
            {soundscape !== 'NONE' && (
              <TouchableOpacity
                style={[
                  styles.playTogglePill,
                  isSoundscapePlaying && styles.playTogglePillPlaying,
                ]}
                onPress={toggleSoundscapePlaying}
                activeOpacity={0.8}
              >
                <Text style={[styles.playToggleText, isSoundscapePlaying && styles.playToggleTextPlaying]}>
                  {isSoundscapePlaying ? '⏸ Đang phát' : '▶ Nghe thử'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.soundscapeDescription}>
            Sử dụng tiếng ồn nâu (Brown Noise) và âm thanh thiên nhiên để chặn âm thanh ngoại cảnh, giảm bồn chồn cho não bộ ADHD.
          </Text>

          <View style={styles.soundscapeList}>
            {SOUNDSCAPE_OPTIONS.map((opt) => {
              const isSelected = soundscape === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  style={[
                    styles.soundscapeCard,
                    isSelected && styles.soundscapeCardSelected,
                  ]}
                  onPress={() => handleSelectSoundscape(opt.type)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.soundscapeIcon}>{opt.icon}</Text>
                  <View style={styles.soundscapeInfo}>
                    <Text
                      style={[
                        styles.soundscapeTitle,
                        isSelected && styles.soundscapeTitleSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.soundscapeDesc}>{opt.desc}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.soundscapeCheck}>
                      <Text style={styles.soundscapeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Accessibility & ADHD Safety Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>THÔNG BÁO VÀ TIẾP CẬN (ADHD ERGONOMICS)</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Rung phản hồi xúc giác (Haptic Feedback)</Text>
              <Text style={styles.toggleHint}>Tạo dopamine thể chất khi hoàn thành nhiệm vụ</Text>
            </View>
            <Switch
              value={hapticFeedbackEnabled}
              onValueChange={toggleHapticFeedback}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor={hapticFeedbackEnabled ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Nhắc nhở dịu dàng (Gentle Chime)</Text>
              <Text style={styles.toggleHint}>Không dùng chuông réo rắt gây giật mình hoảng hốt</Text>
            </View>
            <Switch
              value={gentleNotificationsEnabled}
              onValueChange={toggleGentleNotifications}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor={gentleNotificationsEnabled ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Ẩn cảnh báo quá hạn màu đỏ (Anti-Panic Red)</Text>
              <Text style={styles.toggleHint}>Chống kích hoạt phản ứng né tránh (RSD) của người ADHD</Text>
            </View>
            <Switch
              value={hideRedAlerts}
              onValueChange={toggleHideRedAlerts}
              trackColor={{ false: '#334155', true: '#0284C7' }}
              thumbColor={hideRedAlerts ? '#38BDF8' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Safe Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất an toàn khỏi tài khoản"
          >
            <Text style={styles.logoutBtnText}>Đăng Xuất An Toàn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Chỉnh Sửa Tên Hiển Thị */}
      {isEditingName && (
        <Modal transparent animationType="fade" visible={isEditingName}>
          <View style={styles.modalBackdrop}>
            <View style={styles.editNameCard}>
              <Text style={styles.editNameModalTitle}>Tên Hiển Thị Của Bạn</Text>
              <TextInput
                style={styles.editNameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Nhập tên hiển thị"
                placeholderTextColor="#64748B"
                maxLength={50}
                autoFocus
              />
              <View style={styles.editNameActions}>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => setIsEditingName(false)}
                >
                  <Text style={styles.cancelEditText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveEditBtn,
                    !editedName.trim() && styles.saveEditBtnDisabled,
                  ]}
                  disabled={!editedName.trim()}
                  onPress={() => {
                    if (editedName.trim() && user) {
                      useAuthStore.setState({
                        user: { ...user, displayName: editedName.trim() },
                      });
                    }
                    setIsEditingName(false);
                  }}
                >
                  <Text style={styles.saveEditText}>Lưu Thay Đổi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 16,
    color: '#38BDF8',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerPlaceholder: {
    minWidth: 80,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    maxWidth: '85%',
  },
  editNameBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameIcon: {
    fontSize: 14,
  },
  userEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  userLevelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  userLevelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  streakCard: {
    minHeight: 72,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  streakTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  streakFireIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  streakCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  shieldIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  shieldCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
  },
  streakMessage: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  subHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  energySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  energyChoiceBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  energyChoiceBtnSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  energyChoiceEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  energyChoiceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  energyChoiceLabelSelected: {
    color: '#38BDF8',
  },
  pomodoroList: {
    gap: 8,
  },
  pomodoroOptionCard: {
    minHeight: 52,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pomodoroOptionCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },
  pomodoroOptionInfo: {
    flex: 1,
  },
  pomodoroOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pomodoroOptionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  soundscapeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  playTogglePill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playTogglePillPlaying: {
    backgroundColor: '#F59E0B',
  },
  playToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playToggleTextPlaying: {
    color: '#0F172A', // Slate-900: High contrast 8.26:1 on Amber background (WCAG AA compliant)
  },
  soundscapeDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 18,
  },
  soundscapeList: {
    gap: 8,
  },
  soundscapeCard: {
    minHeight: 48,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundscapeCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F2642',
  },
  soundscapeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  soundscapeInfo: {
    flex: 1,
  },
  soundscapeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  soundscapeTitleSelected: {
    color: '#38BDF8',
  },
  soundscapeDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  soundscapeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  soundscapeCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  toggleHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  logoutBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editNameCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  editNameModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  editNameInput: {
    minHeight: 44,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 16,
  },
  editNameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelEditBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  saveEditBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  saveEditBtnDisabled: {
    opacity: 0.5,
  },
  saveEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
