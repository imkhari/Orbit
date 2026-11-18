import { useLocale } from '../ui/locale';
import React, { useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { ActionButton, LanguageButton } from '../ui/Controls';
import { OrbitIcon } from '../ui/OrbitIcon';
import { colors } from '../ui/theme';

export interface AuthScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Field = 'displayName' | 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const englishErrors: Record<string, string> = {
  'Nhập tên hiển thị từ 2 ký tự.': 'Enter at least 2 characters for your name.',
  'Nhập địa chỉ email của bạn.': 'Enter your email address.',
  'Kiểm tra email, ví dụ ban@email.com.': 'Check your email address, for example you@email.com.',
  'Nhập mật khẩu của bạn.': 'Enter your password.',
  'Mật khẩu cần ít nhất 6 ký tự.': 'Use at least 6 characters.',
  'Email hoặc mật khẩu chưa chính xác.': 'The email or password is incorrect.',
  'Email này đã có tài khoản. Bạn có thể đăng nhập bằng email này.': 'This email already has an account. Sign in with this email.',
  'Địa chỉ này dành cho chế độ thử trên máy.': 'This email is reserved for the local demo.',
  'Chưa kết nối được với Orbit. Bạn có thể thử lại.': 'Could not connect to Orbit. Try again.',
  'Email không đúng định dạng': 'Enter a valid email address.',
  'Email không được để trống': 'Enter your email address.',
  'Mật khẩu không được để trống': 'Enter your password.',
  'Mật khẩu phải từ 6 ký tự trở lên': 'Use at least 6 characters.',
  'Tên hiển thị phải từ 2 đến 50 ký tự': 'Enter 2 to 50 characters for your name.',
};

export function AuthScreen({ onBack, onSuccess }: AuthScreenProps) {
  const t = useLocale();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [registered, setRegistered] = useState(false);

  const { login, register, skipAuth, requiresSignIn, isLoading, error, clearError } = useAuthStore();
  const renderError = (message: string) => t(message, englishErrors[message]
    ?? (isRegisterMode ? 'Could not create your account. Try again.' : 'Could not sign in. Try again.'));
  const title = isRegisterMode ? t("Tạo tài khoản", "Create account") : t('Đăng nhập');

  const changeField = (field: Field, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (error) clearError();
  };

  const switchMode = (nextRegisterMode: boolean) => {
    clearError();
    setFieldErrors({});
    setRegistered(false);
    setPassword('');
    setShowPassword(false);
    setIsRegisterMode(nextRegisterMode);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    clearError();
    const cleanEmail = email.trim();
    const cleanName = displayName.trim();
    const errors: FieldErrors = {};
    if (isRegisterMode && cleanName.length < 2) errors.displayName = "Nhập tên hiển thị từ 2 ký tự.";
    if (!cleanEmail) errors.email = "Nhập địa chỉ email của bạn.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.email = "Kiểm tra email, ví dụ ban@email.com.";
    if (!password.trim()) errors.password = "Nhập mật khẩu của bạn.";
    else if (isRegisterMode && password.length < 6) errors.password = "Mật khẩu cần ít nhất 6 ký tự.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    Keyboard.dismiss();
    if (isRegisterMode) {
      if (await register(cleanEmail, password, cleanName)) {
        setEmail(cleanEmail);
        switchMode(false);
        setRegistered(true);
      }
      return;
    }
    if (await login(cleanEmail, password)) onSuccess();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {!requiresSignIn && (
              <ActionButton label={t("Quay lại", "Back")} variant="quiet" disabled={isLoading} onPress={onBack} />
            )}
            <View style={styles.header}>
              <View style={styles.top}>
                <View style={styles.brand}>
                  <OrbitIcon name="today" color={colors.accent} size={24} />
                  <Text style={styles.brandText}>Orbit</Text>
                </View>
                <LanguageButton />
              </View>
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              <Text style={styles.description}>
                {isRegisterMode ? t("Tạo không gian riêng cho những việc bạn muốn làm.", "Make a space for the things you want to do.") : t("Mở lại bảng việc và tiếp tục từ bước của bạn.", "Open your tasks and pick up where you left off.")}
              </Text>
            </View>

            {registered && (
              <View style={[styles.notice, styles.success]}>
                <Text style={styles.successText} accessibilityLiveRegion="polite">{t("Đăng ký thành công. Nhập mật khẩu để đăng nhập.", "Account created. Enter your password to sign in.")}</Text>
              </View>
            )}

            <View style={styles.form}>
              {isRegisterMode && (
                <View style={styles.field}>
                  <Text style={styles.label}>{t('Tên hiển thị')}</Text>
                  <TextInput style={[styles.input, fieldErrors.displayName && styles.invalid]}
                    accessibilityLabel={t('Tên hiển thị')} value={displayName} maxLength={50}
                    onChangeText={changeField('displayName', setDisplayName)} editable={!isLoading}
                    autoCapitalize="words" autoComplete="name" placeholder={t("Ví dụ: Minh", "For example, Alex")} placeholderTextColor={colors.muted} />
                  {fieldErrors.displayName && <Text style={styles.warningText} accessibilityLiveRegion="polite">{renderError(fieldErrors.displayName)}</Text>}
                </View>
              )}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={[styles.input, fieldErrors.email && styles.invalid]} accessibilityLabel="Email"
                  value={email} onChangeText={changeField('email', setEmail)} editable={!isLoading}
                  placeholder={t("ban@email.com", "you@email.com")} placeholderTextColor={colors.muted}
                  autoComplete="email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                {fieldErrors.email && <Text style={styles.warningText} accessibilityLiveRegion="polite">{renderError(fieldErrors.email)}</Text>}
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{t("Mật khẩu", "Password")}</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={[styles.input, styles.password, fieldErrors.password && styles.invalid]}
                    accessibilityLabel={t("Mật khẩu", "Password")} value={password} onChangeText={changeField('password', setPassword)}
                    placeholder={isRegisterMode ? t("Ít nhất 6 ký tự", "At least 6 characters") : undefined} placeholderTextColor={colors.muted}
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    editable={!isLoading} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
                    returnKeyType="go" onSubmitEditing={handleSubmit} />
                  <Pressable style={styles.visibility} accessibilityRole="button" disabled={isLoading}
                    accessibilityLabel={showPassword ? t("Ẩn mật khẩu", "Hide password") : t("Hiện mật khẩu", "Show password")}
                    onPress={() => setShowPassword((current) => !current)}>
                    <Text style={styles.visibilityText}>{showPassword ? t("Ẩn", "Hide") : t("Hiện", "Show")}</Text>
                  </Pressable>
                </View>
                {fieldErrors.password && <Text style={styles.warningText} accessibilityLiveRegion="polite">{renderError(fieldErrors.password)}</Text>}
              </View>

              {error && (
                <View style={[styles.notice, styles.invalid]}>
                  <Text style={styles.warningText} accessibilityLiveRegion="polite">{renderError(error)}</Text>
                </View>
              )}
              <ActionButton label={isLoading ? (isRegisterMode ? t("Đang tạo tài khoản…", "Creating account…") : t("Đang đăng nhập…", "Signing in…")) : title}
                onPress={handleSubmit} disabled={isLoading} />
            </View>

            <ActionButton variant="quiet" disabled={isLoading}
              label={isRegisterMode ? t("Đã có tài khoản? Đăng nhập", "Already have an account? Sign in") : t("Chưa có tài khoản? Đăng ký", "New to Orbit? Create an account")}
              onPress={() => switchMode(!isRegisterMode)} />
            {!requiresSignIn && (
              <ActionButton label={t("Tiếp tục với chế độ khách", "Continue as a guest")} variant="quiet" disabled={isLoading}
                onPress={() => { skipAuth(); onSuccess(); }} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 12 },
  header: { gap: 8, marginBottom: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  brandText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  input: { color: colors.text, backgroundColor: colors.canvas, borderColor: colors.outline, borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  password: { flex: 1, minWidth: 0 },
  visibility: { minWidth: 52, minHeight: 48, borderRadius: 12, borderColor: colors.outline, borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  visibilityText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  notice: { borderWidth: 1, borderRadius: 12, padding: 12, backgroundColor: colors.canvas },
  success: { borderColor: colors.success },
  successText: { color: colors.success, fontSize: 14, lineHeight: 20 },
  invalid: { borderColor: colors.warning },
  warningText: { color: colors.warning, fontSize: 14, lineHeight: 20 },
});
