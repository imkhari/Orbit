import { useEnergyLabels, useLocale } from '../ui/locale';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { SoundscapeType } from '../types';
import { ActionButton, ChoiceSheet, ScreenHeader } from '../ui/Controls';
import { OrbitIcon } from '../ui/OrbitIcon';
import { colors, energyLevels } from '../ui/theme';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateAuth?: () => void;
}

function SettingRow({ label, value, onPress, expanded }: {
  label: string; value?: string; onPress: () => void; expanded?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button"
      accessibilityLabel={value ? `${label} · ${value}` : label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
      <OrbitIcon name={expanded === undefined ? 'arrow' : 'chevron'} color={colors.muted} size={18} />
    </Pressable>
  );
}

export function SettingsScreen({ onBack, onNavigateAuth }: SettingsScreenProps) {
  const t = useLocale();
  const energyLabels = useEnergyLabels();
  const sounds: { id: SoundscapeType; label: string }[] = [
    { id: 'NONE', label: t("Tắt", "Off") }, { id: 'BROWN_NOISE', label: t("Tiếng ồn nâu", "Brown noise") },
    { id: 'RAIN', label: t("Mưa rào", "Rain") }, { id: 'FOREST', label: t("Rừng thông", "Forest") },
    { id: 'WAVES', label: t("Sóng biển", "Ocean waves") },
  ];
  const energyChoices = energyLevels.map((id) => ({ id, label: energyLabels[id] }));
  const durations = (['15', '25', '45'] as const).map((id) => ({ id, label: t(`${id} phút`, `${id} min`) }));
  const { user, isAuthenticated, logout, setEnergyLevel } = useAuthStore();
  const streak = useTaskStore((state) => state.streak);
  const settings = useSettingsStore();
  const [picker, setPicker] = useState<'duration' | 'sound' | 'energy' | null>(null);
  const [section, setSection] = useState<'account' | 'streak' | 'accessibility' | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const feedback = () => {
    if (settings.hapticFeedbackEnabled && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const signOut = () => {
    Alert.alert(t("Đăng xuất?", "Sign out?"), t("Bạn có thể đăng nhập lại bất kỳ lúc nào.", "You can sign in again at any time."), [
      { text: t('Hủy'), style: 'cancel' },
      { text: t("Đăng xuất", "Sign out"), onPress: () => { logout(); (onNavigateAuth ?? onBack)(); } },
    ]);
  };
  const saveName = () => {
    if (user && displayName.trim()) {
      useAuthStore.setState({ user: { ...user, displayName: displayName.trim() } });
      setIsEditingName(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.top}><ScreenHeader title={t('Cài đặt')} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Tập trung')}</Text>
          <View style={styles.panel}>
            <SettingRow label={t("Thời lượng tập trung", "Focus duration")} value={t(`${settings.pomodoroMinutes} phút`, `${settings.pomodoroMinutes} min`)}
              onPress={() => setPicker('duration')} />
            <SettingRow label={t("Âm thanh", "Sound")} value={sounds.find(({ id }) => id === settings.soundscape)?.label}
              onPress={() => setPicker('sound')} />
            {settings.soundscape !== 'NONE' && (
              <View style={styles.panelAction}>
                <ActionButton variant="quiet" label={settings.isSoundscapePlaying ? t("Dừng phát", "Stop preview") : t("Nghe thử", "Preview sound")}
                  onPress={() => void settings.toggleSoundscapePlaying()} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Tùy chọn khác", "Other settings")}</Text>
          <View style={styles.panel}>
            <SettingRow label={t("Năng lượng mặc định", "Default energy")} value={energyLabels[settings.defaultEnergyLevel]}
              onPress={() => setPicker('energy')} />
            <SettingRow label={t("Tài khoản", "Account")} value={isAuthenticated ? undefined : t("Khách", "Guest")}
              expanded={section === 'account'} onPress={() => setSection(section === 'account' ? null : 'account')} />
            {section === 'account' && (
              <View style={styles.detail}>
                <Text style={styles.rowLabel}>{user?.displayName ?? t("Khách", "Guest")}</Text>
                {isAuthenticated && user?.email && <Text style={styles.muted}>{user.email}</Text>}
                {user && <ActionButton variant="secondary" label={t("Đổi tên hiển thị", "Change display name")} onPress={() => {
                  setDisplayName(user.displayName);
                  setIsEditingName(true);
                }} />}
                {(isAuthenticated || onNavigateAuth) && <ActionButton variant="quiet"
                  label={isAuthenticated ? t("Đăng xuất", "Sign out") : t('Đăng nhập')}
                  onPress={isAuthenticated ? signOut : (onNavigateAuth ?? onBack)} />}
              </View>
            )}
            <SettingRow label={t("Chuỗi ngày", "Streak")} value={t(`${streak.currentStreak} ngày`, `${streak.currentStreak} days`)}
              expanded={section === 'streak'} onPress={() => setSection(section === 'streak' ? null : 'streak')} />
            {section === 'streak' && (
              <View style={styles.detail}>
                <Text style={styles.freeze}>{t(`${streak.freezeCredits} khiên bảo vệ`, `${streak.freezeCredits} shields`)}</Text>
                <Text style={styles.muted}>{t(`Kỷ lục ${streak.longestStreak} ngày`, `Best streak: ${streak.longestStreak} days`)} · {streak.totalXp} XP</Text>
                <Text style={styles.muted}>{t("Khiên tự động bảo vệ chuỗi ngày nếu bạn bỏ lỡ một ngày.", "Shields protect your streak when you miss a day.")}</Text>
              </View>
            )}
            <SettingRow label={t("Trợ năng và thông báo", "Accessibility and notifications")} expanded={section === 'accessibility'}
              onPress={() => setSection(section === 'accessibility' ? null : 'accessibility')} />
            {section === 'accessibility' && (
              <View style={styles.detail}>
                {[
                  { label: t("Rung phản hồi", "Haptic feedback"), value: settings.hapticFeedbackEnabled, change: settings.toggleHapticFeedback },
                  { label: t("Nhắc nhở nhẹ", "Gentle reminders"), value: settings.gentleNotificationsEnabled, change: settings.toggleGentleNotifications },
                  { label: t("Giảm nhấn việc quá hạn", "Reduce overdue emphasis"), value: settings.hideRedAlerts, change: settings.toggleHideRedAlerts },
                ].map(({ label, value, change }) => (
                  <View key={label} style={styles.toggle}>
                    <Text style={styles.rowLabel}>{label}</Text>
                    <Switch accessibilityLabel={label} value={value} onValueChange={change}
                      trackColor={{ false: colors.border, true: colors.accent }} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {picker === 'duration' && <ChoiceSheet title={t("Thời lượng tập trung", "Focus duration")} choices={durations}
        selected={`${settings.pomodoroMinutes}`} onSelect={(value) => {
          feedback();
          settings.setPomodoroMinutes(value === '15' ? 15 : value === '45' ? 45 : 25);
        }} onClose={() => setPicker(null)} />}
      {picker === 'sound' && <ChoiceSheet title={t("Âm thanh", "Sound")} choices={sounds} selected={settings.soundscape}
        onSelect={(value) => { feedback(); void settings.setSoundscape(value); }} onClose={() => setPicker(null)} />}
      {picker === 'energy' && <ChoiceSheet title={t("Năng lượng mặc định", "Default energy")} choices={energyChoices}
        selected={settings.defaultEnergyLevel} onSelect={(value) => {
          feedback();
          settings.setDefaultEnergyLevel(value);
          void setEnergyLevel(value);
        }} onClose={() => setPicker(null)} />}

      {isEditingName && (
        <Modal visible transparent animationType="none" onRequestClose={() => setIsEditingName(false)}>
          <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.editor}>
              <ScreenHeader title={t('Tên hiển thị')} onClose={() => setIsEditingName(false)} />
              <TextInput accessibilityLabel={t('Tên hiển thị')} style={styles.input} autoFocus maxLength={50}
                value={displayName} onChangeText={setDisplayName} onSubmitEditing={saveName} returnKeyType="done" />
              <ActionButton label={t('Lưu')} disabled={!displayName.trim()} onPress={saveName} />
              <ActionButton variant="quiet" label={t('Hủy')} onPress={() => setIsEditingName(false)} />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  top: { paddingHorizontal: 20, paddingTop: 10 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 24 },
  title: { color: colors.text, fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8 },
  section: { gap: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', lineHeight: 24 },
  panel: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  panelAction: { paddingHorizontal: 8, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  value: { color: colors.muted, maxWidth: '42%', fontSize: 14, textAlign: 'right' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  detail: { padding: 16, gap: 8, backgroundColor: colors.canvas, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  toggle: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8 },
  freeze: { color: colors.freeze, fontSize: 15, fontWeight: '700' },
  modal: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(2, 6, 23, 0.72)' },
  editor: { padding: 16, borderRadius: 16, backgroundColor: colors.surface, gap: 12 },
  input: { color: colors.text, minHeight: 48, borderColor: colors.outline, borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 16 },
});
