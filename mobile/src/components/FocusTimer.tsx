import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMinutes]);

  // Watch for timer reaching zero and trigger completion side-effects
  useEffect(() => {
    if (secondsLeft === 0 && isActive) {
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

  // Tick interval — pure updater function inside setSecondsLeft
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    }
    setIsActive((prev) => !prev);
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
        >
          <Text style={styles.mainButtonText}>
            {isActive ? '⏸ Tạm dừng' : secondsLeft === 0 ? '🔄 Bắt đầu lại' : '▶ Bắt đầu'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  dialContainerActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  dialContainerCompleted: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
  },
  dialInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  timerBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  timeDisplay: {
    fontSize: 46,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timeDisplayActive: {
    color: '#38BDF8',
  },
  timeDisplayCompleted: {
    color: '#10B981',
  },
  sessionGoalText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  progressBarWrapper: {
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressBarFillCompleted: {
    backgroundColor: '#10B981',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  mainButton: {
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButton: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
  },
  pauseButton: {
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resetButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
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
