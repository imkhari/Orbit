import { useLocale } from '../ui/locale';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  AppState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { FocusTimerState, formatTimer, secondsRemaining } from '../store/useFocusStore';

import { ActionButton } from '../ui/Controls';
import { colors } from '../ui/theme';

const ticks = Array.from({ length: 16 }, (_, index) => {
  const angle = index / 16 * 2 * Math.PI - Math.PI / 2;
  return { left: 65 + 63 * Math.cos(angle), top: 65 + 63 * Math.sin(angle) };
});

interface FocusTimerProps {
  initialMinutes: number;
  timer?: FocusTimerState;
  checklistProgress?: number;
  onChange: (timer?: FocusTimerState) => void;
  onComplete: (timer: FocusTimerState) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialMinutes,
  timer,
  checklistProgress,
  onChange,
  onComplete,
}) => {
  const t = useLocale();
  const minutes = timer?.minutes ?? initialMinutes;
  const totalSeconds = minutes * 60;
  const [now, setNow] = useState(Date.now);
  const endsAt = timer?.endsAt ?? null;
  const isActive = endsAt !== null;
  const secondsLeft = timer ? secondsRemaining(timer, now) : totalSeconds;
  const hasCompleted = !isActive && secondsLeft === 0;

  useEffect(() => {
    if (endsAt === null) return;

    const sync = () => setNow(Date.now());
    sync();
    const interval = setInterval(sync, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    void activateKeepAwakeAsync('focus-timer').catch(() => undefined);
    return () => {
      clearInterval(interval);
      subscription.remove();
      void deactivateKeepAwake('focus-timer');
    };
  }, [endsAt]);

  useEffect(() => {
    if (timer && timer.endsAt !== null && secondsLeft === 0) {
      onComplete(timer);
    }
  }, [secondsLeft, timer, onComplete]);

  const handleToggle = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentTime = Date.now();
    setNow(currentTime);
    if (timer?.endsAt != null) {
      const remainingSeconds = secondsRemaining(timer, currentTime);
      if (remainingSeconds === 0) {
        onComplete(timer);
      } else {
        onChange({ ...timer, remainingSeconds, endsAt: null });
      }
      return;
    }

    const remainingSeconds = timer?.remainingSeconds || totalSeconds;
    onChange({ minutes, remainingSeconds, endsAt: currentTime + remainingSeconds * 1000 });
  };

  const completedTicks = Math.round(ticks.length * (checklistProgress ?? 1 - secondsLeft / totalSeconds));
  const modeLabel = hasCompleted ? t("Phiên đã kết thúc", "Session ended") : isActive ? t("Đang tập trung", "Focusing") : timer ? t("Đã tạm dừng", "Paused") : t(`${minutes} phút`, `${minutes} min`);
  const buttonLabel = isActive ? t("Tạm dừng", "Pause") : hasCompleted ? t("Bắt đầu lại", "Restart") : timer ? t("Tiếp tục đếm giờ", "Resume timer") : t("Bắt đầu đếm giờ", "Start timer");

  return (
    <View style={styles.timer}>
      <View style={styles.dial}>
        <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {ticks.map((point, index) => (
            <View key={index} style={[styles.tick, point, index < completedTicks && styles.tickComplete]} />
          ))}
        </View>
        <Text style={styles.time}>{formatTimer(secondsLeft)}</Text>
        <Text style={styles.caption}>{modeLabel}</Text>
      </View>
      <View style={styles.controls}>
        <ActionButton variant="secondary" label={buttonLabel} onPress={handleToggle} />
        {timer && <ActionButton variant="quiet" label={t("Đặt lại", "Reset")} onPress={() => onChange(undefined)} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timer: { alignItems: 'center', gap: 8 },
  dial: { width: 138, minHeight: 138, justifyContent: 'center', alignItems: 'center', gap: 2, paddingHorizontal: 16, paddingVertical: 20 },
  track: { position: 'absolute', width: 138, height: 138, top: 0, left: 0, borderRadius: 69, borderWidth: 1, borderColor: colors.border },
  tick: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: colors.outline },
  tickComplete: { backgroundColor: colors.success },
  time: { color: colors.text, fontSize: 29, fontWeight: '700', fontVariant: ['tabular-nums'] },
  caption: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
});
