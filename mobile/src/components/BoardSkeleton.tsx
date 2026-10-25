import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, SafeAreaView } from 'react-native';

export const BoardSkeleton: React.FC = () => {
  // Hiệu ứng thở (breathing pulse) mờ dịu, nhịp nhàng 1.2s giúp xoa dịu lo âu ADHD
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Skeleton Header Area */}
      <View style={styles.header}>
        <View>
          <View style={styles.headerTitlePlaceholder} />
          <View style={styles.headerSubtitlePlaceholder} />
        </View>
        <View style={styles.focusBtnPlaceholder} />
      </View>

      {/* Energy & Streak Widget Placeholder */}
      <View style={styles.widgetPlaceholder}>
        <View style={styles.energyPillPlaceholder} />
        <View style={styles.streakBadgePlaceholder} />
      </View>

      {/* Column Tabs Placeholder */}
      <View style={styles.columnTabBarPlaceholder}>
        <View style={[styles.columnTabPlaceholder, styles.columnTabActive]} />
        <View style={styles.columnTabPlaceholder} />
        <View style={styles.columnTabPlaceholder} />
        <View style={styles.columnTabPlaceholder} />
      </View>

      {/* Calming Pulse Card Silhouettes */}
      <View style={styles.cardListContainer}>
        {[1, 2, 3].map((key) => (
          <Animated.View
            key={key}
            style={[styles.skeletonCard, { opacity: pulseAnim }]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardBadgePlaceholder} />
              <View style={styles.cardMenuPlaceholder} />
            </View>

            <View style={styles.cardTitleLine1} />
            <View style={styles.cardTitleLine2} />

            <View style={styles.cardFooterRow}>
              <View style={styles.cardTagPlaceholder} />
              <View style={styles.cardTimePlaceholder} />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Soothing Non-Alarmist ADHD Status Message */}
      <View style={styles.calmMessageContainer}>
        <Text style={styles.calmMessageIcon}>🌌</Text>
        <Text style={styles.calmMessageTitle}>
          Orbit đang chuẩn bị không gian làm việc dịu êm...
        </Text>
        <Text style={styles.calmMessageSubtitle}>
          Mọi việc lớn đều bắt đầu từ một bước nhỏ vừa sức.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Canvas Slate-900
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitlePlaceholder: {
    width: 110,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    marginBottom: 6,
  },
  headerSubtitlePlaceholder: {
    width: 180,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  focusBtnPlaceholder: {
    width: 100,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  widgetPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  energyPillPlaceholder: {
    width: 160,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  streakBadgePlaceholder: {
    width: 90,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  columnTabBarPlaceholder: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 6,
  },
  columnTabPlaceholder: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  columnTabActive: {
    backgroundColor: '#334155',
  },
  cardListContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: '#1E293B', // Surface Slate-800
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 110,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardBadgePlaceholder: {
    width: 70,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  cardMenuPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  cardTitleLine1: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#334155',
    marginBottom: 8,
  },
  cardTitleLine2: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTagPlaceholder: {
    width: 80,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  cardTimePlaceholder: {
    width: 50,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  calmMessageContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  calmMessageIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  calmMessageTitle: {
    color: '#94A3B8', // Slate-400 (Contrast >= 4.5:1 on #0F172A)
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  calmMessageSubtitle: {
    color: '#64748B', // Slate-500
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
