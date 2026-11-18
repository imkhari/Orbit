import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
import { IconName, OrbitIcon } from './OrbitIcon';
import { Language, useSettingsStore } from '../store/useSettingsStore';
import { useLocale } from './locale';

export function LanguageButton() {
  const t = useLocale();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={styles.language} accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={t('Đổi ngôn ngữ', 'Change language')} onPress={() => setOpen(true)}>
        <Text style={styles.languageLabel}>{language === 'en' ? 'EN' : 'VI'}</Text>
        <OrbitIcon name="chevron" color={colors.muted} size={16} />
      </Pressable>
      {open && <ChoiceSheet<Language> title={t('Ngôn ngữ', 'Language')} selected={language}
        choices={[{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }]}
        onSelect={setLanguage} onClose={() => setOpen(false)} showLanguage={false} />}
    </>
  );
}

export function ScreenHeader({ title, onClose }: { title: string; onClose?: () => void }) {
  const t = useLocale();
  return (
    <View style={styles.heading}>
      {onClose && <Pressable style={styles.close} onPress={onClose} accessibilityRole="button"
        accessibilityLabel={t('Đóng')}><OrbitIcon name="close" color={colors.muted} /></Pressable>}
      <Text style={[styles.title, !onClose && styles.screenTitle]} accessibilityRole="header">{title}</Text>
      <LanguageButton />
    </View>
  );
}

export function ActionButton({ label, onPress, variant = 'primary', icon, disabled }: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: IconName;
  disabled?: boolean;
}) {
  const foreground = variant === 'primary' && !disabled ? colors.accentInk : colors.text;
  return (
    <Pressable
      style={({ pressed }) => [styles.button, styles[variant], disabled && styles.disabled, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {icon && <OrbitIcon name={icon} color={foreground} size={20} />}
      <Text style={[styles.buttonLabel, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function ChoiceSheet<T extends string>({ title, selected, choices, onSelect, onClose, showLanguage = true }: {
  title: string;
  selected: T;
  choices: { id: T; label: string }[];
  onSelect: (choice: T) => void;
  onClose: () => void;
  showLanguage?: boolean;
}) {
  const t = useLocale();
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        <SafeAreaView style={styles.sheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.heading}>
            <Pressable style={styles.close} onPress={onClose} accessibilityLabel={t('Đóng')} accessibilityRole="button">
              <OrbitIcon name="close" color={colors.muted} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            {showLanguage && <LanguageButton />}
          </View>
          {choices.map(({ id, label }) => (
            <Pressable key={id} style={styles.choice} accessibilityRole="radio"
              accessibilityState={{ checked: selected === id }}
              onPress={() => { onSelect(id); onClose(); }}>
              <Text style={styles.choiceLabel}>{label}</Text>
              {selected === id && <Text style={styles.check}>✓</Text>}
            </Pressable>
          ))}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 44, minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  quiet: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.border },
  pressed: { opacity: 0.78 },
  buttonLabel: { fontSize: 15, lineHeight: 21, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 6, 23, 0.72)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  screenTitle: { fontSize: 32, lineHeight: 40 },
  language: { minHeight: 44, minWidth: 52, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, borderWidth: 1, borderColor: colors.outline },
  languageLabel: { color: colors.text, fontWeight: '600', fontSize: 13 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  choice: { minHeight: 52, paddingVertical: 8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.border, gap: 8 },
  choiceLabel: { color: colors.text, fontSize: 16, flexShrink: 1 },
  check: { color: colors.accent, fontSize: 20 },
});
