/**
 * Infinity Talks — Design System
 * Premium dark-mode theme with glassmorphism, gradients, and micro-animations.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Core backgrounds
  background: '#08080F',
  backgroundSecondary: '#0E0E1A',
  surface: '#14142B',
  surfaceLight: '#1C1C3A',

  // Glass surfaces
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassHover: 'rgba(255, 255, 255, 0.07)',

  // Text hierarchy
  textPrimary: '#F0F0F5',
  textSecondary: '#8B8BA3',
  textTertiary: '#5C5C7A',
  textAccent: '#A78BFA',

  // Accent palette
  accentPurple: '#A78BFA',
  accentViolet: '#7C3AED',
  accentCyan: '#22D3EE',
  accentBlue: '#3B82F6',
  accentPink: '#EC4899',
  accentGreen: '#34D399',
  accentOrange: '#F97316',
  accentRed: '#EF4444',
  accentGold: '#FBBF24',
  accentTeal: '#14B8A6',

  // Gradients (as tuples)
  gradientPrimary: ['#7C3AED', '#3B82F6'] as [string, string],
  gradientCyan: ['#06B6D4', '#3B82F6'] as [string, string],
  gradientPink: ['#EC4899', '#A78BFA'] as [string, string],
  gradientGold: ['#F59E0B', '#EF4444'] as [string, string],
  gradientGreen: ['#10B981', '#06B6D4'] as [string, string],
  gradientSunset: ['#F97316', '#EC4899'] as [string, string],

  // Chat bubbles
  bubbleUser: '#7C3AED',
  bubbleUserEnd: '#3B82F6',
  bubbleExpert: 'rgba(255, 255, 255, 0.06)',
  bubbleExpertBorder: 'rgba(255, 255, 255, 0.1)',

  // Misc
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Shadows = {
  card: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  }) as any,
  glow: (color: string) => Platform.select({
    web: { boxShadow: `0px 0px 20px ${color}66` },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
  }) as any,
};

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};
