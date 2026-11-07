import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  Platform,
  AppState,
  AppStateStatus,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const dialSize = Math.min(Math.round(screenWidth * 0.52), 200);

interface FocusTimerProps {
  initialMinutes?: number;
  onComplete?: () => void;
  onSessionTick?: (secondsLeft: number) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialMinutes = 25,
  onComplete,
  onSessionTick,
}) => {
  const totalSeconds = initialMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Store latest callbacks in refs to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  const onSessionTickRef = useRef(onSessionTick);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    onSessionTickRef.current = onSessionTick;
  }, [onSessionTick]);

  // Sync state if initialMinutes changes and timer hasn't started.
  useEffect(() => {
    if (!isActive && secondsLeft === totalSeconds) {
      setSecondsLeft(initialMinutes * 60);
      endTimeRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMinutes]);

  // Watch for timer reaching zero and trigger completion side-effects
  useEffect(() => {
    if (secondsLeft === 0 && isActive) {
      endTimeRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
      setHasCompleted(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate([0, 500, 200, 500]);
      }
      onCompleteRef.current?.();
    }
  }, [secondsLeft, isActive]);

  // Tick interval với mốc endTime thực tế — chống trôi lệch thời gian khi app chạy ngầm hoặc tắt màn hình
  useEffect(() => {
    if (isActive) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + secondsLeft * 1000;
      }

      const syncRemainingTime = () => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
      };

      timerRef.current = setInterval(syncRemainingTime, 1000);

      // Đồng bộ ngay lập tức khi ứng dụng chuyển từ Background quay lại Foreground (Active)
      const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          syncRemainingTime();
        }
      });

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        subscription.remove();
      };
    } else {
      endTimeRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive]);

  // Handle onSessionTick callback safely outside the state updater function
  const prevSecondsRef = useRef(secondsLeft);
  useEffect(() => {
    if (isActive && prevSecondsRef.current !== secondsLeft && secondsLeft > 0) {
      onSessionTickRef.current?.(secondsLeft);
    }
    prevSecondsRef.current = secondsLeft;
  }, [secondsLeft, isActive]);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setHasCompleted(false);
      endTimeRef.current = Date.now() + totalSeconds * 1000;
    } else if (!isActive) {
      endTimeRef.current = Date.now() + secondsLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsActive((prev) => !prev);
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    endTimeRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setSecondsLeft(totalSeconds);
    setHasCompleted(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs
      .toString()
      .padStart(2, '0')}`;
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100)
  );

  return (
    <View style={styles.container}>
      {/* Soothing Circular Dial Frame */}
      <View
        style={[
          styles.dialContainer,
          isActive && styles.dialContainerActive,
          hasCompleted && styles.dialContainerCompleted,
        ]}
      >
        <View style={styles.dialInner}>
          <Text style={styles.timerBadge}>
            {hasCompleted
              ? '🎉 Hoàn thành phiên!'
              : isActive
              ? '✨ Đang tập trung sâu'
              : '🧘 Sẵn sàng tập trung'}
          </Text>
          <Text
            style={[
              styles.timeDisplay,
              isActive && styles.timeDisplayActive,
              hasCompleted && styles.timeDisplayCompleted,
            ]}
          >
            {formatTime(secondsLeft)}
          </Text>
          <Text style={styles.sessionGoalText}>
            Mục tiêu: {initialMinutes} phút đếm lùi
          </Text>
        </View>
      </View>

      {/* Gentle, non-anxiety progress bar */}
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              hasCompleted && styles.progressBarFillCompleted,
            ]}
          />
        </View>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Tiến độ phiên</Text>
          <Text style={styles.progressValue}>
            {Math.round(progressPercent)}%
          </Text>
        </View>
      </View>

      {/* Control Buttons (WCAG AA Target >= 48dp) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.mainButton,
            isActive ? styles.pauseButton : styles.startButton,
          ]}
          onPress={handleToggle}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isActive
              ? 'Tạm dừng đếm thời gian tập trung'
              : secondsLeft === 0
              ? 'Bắt đầu lại phiên tập trung'
              : 'Bắt đầu phiên tập trung Pomodoro'
          }
          accessibilityHint="Chạm để bắt đầu hoặc tạm dừng đếm ngược"
        >
          <Text style={styles.mainButtonText}>
            {isActive ? '⏸ Tạm dừng' : secondsLeft === 0 ? '🔄 Bắt đầu lại' : '▶ Bắt đầu'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Đặt lại thời gian tập trung ban đầu"
          accessibilityHint="Chạm để đưa đồng hồ về mốc ban đầu"
        >
          <Text style={styles.resetButtonText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  dialContainer: {
    width: dialSize,
    height: dialSize,
    borderRadius: dialSize / 2,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#334155',
  },
  dialContainerActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  dialContainerCompleted: {
    borderColor: '#34D399',
  },
  dialInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  timerBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  timeDisplay: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: dialSize < 190 ? 38 : 44,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  timeDisplayActive: {
    color: '#38BDF8',
  },
  timeDisplayCompleted: {
    color: '#34D399',
  },
  sessionGoalText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  progressBarWrapper: {
    width: '100%',
    maxWidth: 280,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  progressBarFillCompleted: {
    backgroundColor: '#34D399',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  mainButton: {
    minHeight: 44,
    paddingHorizontal: 24,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#0284C7',
  },
  pauseButton: {
    backgroundColor: '#F59E0B', // Sand Amber token ấm áp, dịu mắt (không dùng đỏ)
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
});
