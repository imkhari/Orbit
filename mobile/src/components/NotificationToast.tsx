import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  Animated,
  TouchableOpacity,
  View,
} from 'react-native';

export interface NotificationToastProps {
  visible: boolean;
  message: string;
  type?: 'info' | 'warning' | 'success';
  onDismiss: () => void;
  durationMs?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  message,
  type = 'warning',
  onDismiss,
  durationMs = 3500,
}) => {
  // Internal state to keep component mounted during slide-up exit animation
  const [shouldRender, setShouldRender] = useState<boolean>(visible);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDismissingRef = useRef<boolean>(false);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const handleDismiss = () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: -120,
        damping: 15,
        stiffness: 120,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isDismissingRef.current = false;
      setShouldRender(false);
      onDismissRef.current();
    });
  };

  useEffect(() => {
    if (visible) {
      isDismissingRef.current = false;
      setShouldRender(true);

      // Spring entrance conforming to AGENTS.md / 02_WIREFRAMES_AND_PROTOTYPE.md specs:
      // { damping: 15, stiffness: 120, mass: 1 }
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, durationMs);
    } else if (shouldRender && !isDismissingRef.current) {
      handleDismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message, durationMs]);

  if (!shouldRender) return null;

  const getBorderColor = () => {
    switch (type) {
      case 'warning':
        return '#FBBF24'; // Sand Amber
      case 'success':
        return '#34D399'; // Mint Emerald
      case 'info':
      default:
        return '#38BDF8'; // Sky Blue
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '🎯';
      case 'success':
        return '✨';
      case 'info':
      default:
        return '💡';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: getBorderColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.innerTouch}
        onPress={handleDismiss}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.icon}>{getIcon()}</Text>
        <View style={styles.textWrapper}>
          <Text style={styles.messageText}>{message}</Text>
          <Text style={styles.dismissHint}>Chạm để đóng</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54, // Floating card 54pt from top per design doc section 2.4
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#1E293B', // Slate-800
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  innerTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48, // WCAG Touch-target >= 44x44 pt
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC', // Slate-50, contrast > 13:1
    lineHeight: 18,
  },
  dismissHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
