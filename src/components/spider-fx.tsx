import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Pattern, Rect } from 'react-native-svg';

// Halftone Dot Pattern Background Accent
export const HalftoneBackground = ({
  opacity = 0.15,
}: {
  opacity?: number;
}) => (
  <View style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}>
    <Svg width="100%" height="100%">
      <Pattern id="halftone" width="12" height="12" patternUnits="userSpaceOnUse">
        <Circle cx="6" cy="6" r="2.5" fill="#FFFFFF" />
      </Pattern>
      <Rect width="100%" height="100%" fill="url(#halftone)" />
    </Svg>
  </View>
);

// Vector Spider Web Watermark Overlay for Card Corners
export const WebCornerOverlay = ({
  color = '#E63946',
  opacity = 0.25,
  size = 110,
  corner = 'top-right',
}: {
  color?: string;
  opacity?: number;
  size?: number;
  corner?: 'top-right' | 'bottom-right';
}) => (
  <View
    style={[
      styles.webOverlay,
      corner === 'bottom-right' ? styles.webOverlayBottom : styles.webOverlayTop,
      { opacity, width: size, height: size },
    ]}
  >
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={corner === 'bottom-right' ? styles.flipped : undefined}
    >
      <Path d="M 0,0 L 100,0 L 0,100 Z" fill="none" />
      <Line x1="0" y1="0" x2="100" y2="100" stroke={color} strokeWidth="1.5" />
      <Line x1="0" y1="0" x2="100" y2="50" stroke={color} strokeWidth="1" />
      <Line x1="0" y1="0" x2="50" y2="100" stroke={color} strokeWidth="1" />
      <Line x1="0" y1="0" x2="100" y2="25" stroke={color} strokeWidth="0.8" />
      <Line x1="0" y1="0" x2="25" y2="100" stroke={color} strokeWidth="0.8" />
      <Path d="M 20,0 Q 20,20 0,20" stroke={color} strokeWidth="1.2" fill="none" />
      <Path d="M 45,0 Q 45,45 0,45" stroke={color} strokeWidth="1.2" fill="none" />
      <Path d="M 70,0 Q 70,70 0,70" stroke={color} strokeWidth="1.2" fill="none" />
      <Path d="M 95,0 Q 95,95 0,95" stroke={color} strokeWidth="1.2" fill="none" />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  webOverlay: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  webOverlayTop: {
    top: 0,
    right: 0,
  },
  webOverlayBottom: {
    bottom: 0,
    right: 0,
  },
  flipped: {
    transform: [{ rotate: '90deg' }],
  },
});
