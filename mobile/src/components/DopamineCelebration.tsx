import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface DopamineCelebrationProps {
  visible: boolean;
  message?: string;
  xpAmount?: number;
  onAnimationEnd?: () => void;
}

export const DopamineCelebration: React.FC<DopamineCelebrationProps> = ({
  visible,
  message = 'Dopamine Ignition!',
  xpAmount = 10,
  onAnimationEnd,
}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      translateY.setValue(20);
      opacity.setValue(0);
      scale.setValue(0.7);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -40,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onAnimationEnd?.();
        });
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <Text style={styles.starIcon}>✨</Text>
        <Text style={styles.xpText}>+{xpAmount} XP</Text>
        <Text style={styles.labelText}>{message}</Text>
        <Text style={styles.starIcon}>🎉</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  starIcon: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
    marginRight: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 4,
  },
});
