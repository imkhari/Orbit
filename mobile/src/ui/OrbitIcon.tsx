import React from 'react';
import { View, ViewStyle } from 'react-native';

export type IconName = 'today' | 'board' | 'settings' | 'plus' | 'filter' | 'chevron' | 'close' | 'arrow';

export function OrbitIcon({ name, color, size = 24 }: { name: IconName; color: string; size?: number }) {
  const scale = size / 24;
  const line = (x: number, y: number, width: number, rotation = 0) => (
    <View key={`${x}-${y}`} style={{
      position: 'absolute', left: x * scale, top: y * scale, width: width * scale,
      height: 1.7 * scale, borderRadius: scale, backgroundColor: color,
      transform: [{ rotate: `${rotation}deg` }],
    }} />
  );
  const box = (x: number, y: number, width: number, height: number, radius: number, filled = false) => {
    const style: ViewStyle = {
      position: 'absolute', left: x * scale, top: y * scale, width: width * scale,
      height: height * scale, borderRadius: radius * scale, borderWidth: 1.6 * scale,
      borderColor: color, backgroundColor: filled ? color : 'transparent',
    };
    return <View key={`${x}-${y}-box`} style={style} />;
  };
  const shapes = {
    today: [box(4, 4, 16, 16, 8), box(10, 10, 4, 4, 2, true), box(17, 4, 3, 3, 2, true)],
    board: [box(3, 5, 18, 14, 3), line(7, 11, 10, 90), line(12, 9, 5)],
    settings: [line(4, 6, 16), line(4, 12, 16), line(4, 18, 16), box(8, 4.5, 4, 4, 2, true), box(14, 10.5, 4, 4, 2, true), box(8, 16.5, 4, 4, 2, true)],
    plus: [line(5, 11, 14), line(5, 11.1, 14, 90)],
    filter: [line(4, 6, 16), line(7, 11, 10), line(10, 16, 4)],
    chevron: [line(7, 10, 6, 45), line(11, 10, 6, -45)],
    close: [line(5, 11, 14, 45), line(5, 11.1, 14, -45)],
    arrow: [line(5, 11, 14), line(12, 8.5, 7, 45), line(12, 13.5, 7, -45)],
  };
  return <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{shapes[name]}</View>;
}
