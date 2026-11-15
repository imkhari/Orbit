import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/useAuthStore';

export interface AuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login, register, skipAuth, isLoading, error, clearError } = useAuthStore();

  const handleToggleMode = (registerMode: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearError();
    setIsRegisterMode(registerMode);
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isRegisterMode) {
      const cleanName = displayName.trim() || 'ADHD Explorer';
      const success = await register(cleanEmail, cleanPass, cleanName);
      if (success) {
        onSuccess();
      }
    } else {
      const success = await login(cleanEmail, cleanPass);
      if (success) {
        onSuccess();
      }
    }
  };

  const handleGuestMode = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    skipAuth();
    onSuccess();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar: Back */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Quay lại màn hình trước"
            >
              <Text style={styles.backBtnText}>← Quay lại</Text>
            </TouchableOpacity>
          </View>

          {/* Title & Empathetic Subtitle */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>
              {isRegisterMode ? 'Tạo Tài Khoản Orbit' : 'Đăng Nhập Vào Orbit'}
            </Text>
            <Text style={styles.subtitle}>
              Không cần vội vã. Hãy bước vào không gian tĩnh lặng của bạn 🌿
            </Text>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.modeTabBar}>
            <TouchableOpacity
              style={[styles.modeTab, !isRegisterMode && styles.modeTabActive]}
              onPress={() => handleToggleMode(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeTabText,
                  !isRegisterMode && styles.modeTabTextActive,
                ]}
              >
                Đăng Nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, isRegisterMode && styles.modeTabActive]}
              onPress={() => handleToggleMode(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeTabText,
                  isRegisterMode && styles.modeTabTextActive,
                ]}
              >
                Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gentle Error Notice (Soft Coral #F87171, no panic red) */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>🌱</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formSection}>
            {isRegisterMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>TÊN HIỂN THỊ</Text>
                <TextInput
                  style={styles.textInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Ví dụ: Alex, Bình..."
                  placeholderTextColor="#64748B"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Tối thiểu 6 ký tự"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeBtnText}>
                    {showPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isRegisterMode ? 'Tạo tài khoản' : 'Đăng nhập'}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegisterMode ? 'TẠO TÀI KHOẢN 🌿' : 'ĐĂNG NHẬP 🌌'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Mode (Zero friction for ADHD minds) */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleGuestMode}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Khám phá chế độ khách không cần tài khoản"
          >
            <Text style={styles.guestBtnText}>
              🚀 Dùng ngay chế độ Khách (Không cần tài khoản)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerBlock: {
    marginBottom: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeTab: {
    flex: 1,
    minHeight: 44, // WCAG Touch Target >= 44x44 pt
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#0F172A',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
  },
  formSection: {
    marginBottom: 24,
    gap: 14,
  },
  inputGroup: {},
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    minHeight: 48,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 15,
    paddingHorizontal: 14,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtnText: {
    fontSize: 16,
  },
  submitBtn: {
    minHeight: 52,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    marginHorizontal: 12,
  },
  guestBtn: {
    minHeight: 48,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  guestBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
});
