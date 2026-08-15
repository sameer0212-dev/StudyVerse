import '@/global.css';

import { Platform } from 'react-native';

/**
 * Base colors used by the app.
 * Keep these for existing components that still use the old system.
 */
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },

  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;


/**
 * StudyVerse dynamic themes
 *
 * Add new themes here.
 * Screens should use these values instead of hardcoded colors.
 */
export const AppThemes = {

  webHero: {
    id: 'webHero',
    name: 'Spider-Verse',
    emoji: '🕷️',

    colors: {
      background: '#080B12',       // Deep comic midnight suit background
      card: '#111625',             // Midnight blue-charcoal card tint
      cardElevated: '#1A2238',     // Elevated suit-panel tone

      primary: '#E62429',          // Authentic Marvel Spider-Red
      primaryDark: '#B21B20',      // Deep crimson shadow
      primarySoft: '#331219',     // Subtle red glow container tint

      text: '#FFFFFF',             // Crisp web white
      textSecondary: '#94A3B8',    // Muted suit slate
      textMuted: '#64748B',        // Muted shadow text

      border: '#232D45',          // Blue-tinted suit seam border

      success: '#39D98A',
      warning: '#FFB547',
      danger: '#FF4D5E',
    },

    labels: {
      mission: "Today's Mission",
      progress: 'Web Mastery',
      library: 'Library',
      quiz: 'Quiz',
      themes: 'Suits & Themes',
    },

    style: {
      cornerRadius: 18,
      buttonRadius: 13,
    },
  },

  bts: {
    id: 'bts',
    name: 'BTS Army',
    emoji: '💜',

    colors: {
      background: '#0F0914',       // Dark violet night
      card: '#1A1224',             // Deep purple card
      cardElevated: '#281A38',     // Elevated purple container

      primary: '#A855F7',          // Electric BTS Purple
      primaryDark: '#7E22CE',      // Deep purple
      primarySoft: '#33184A',     // Soft lavender tint

      text: '#FFFFFF',
      textSecondary: '#A799B8',
      textMuted: '#736685',

      border: '#332047',

      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F87171',
    },

    labels: {
      mission: "Today's Mission",
      progress: 'Stage Mastery',
      library: 'Library',
      quiz: 'Quiz',
      themes: 'Themes',
    },

    style: {
      cornerRadius: 18,
      buttonRadius: 13,
    },
  },

} as const;


/**
 * Theme ID
 */
export type ThemeId = keyof typeof AppThemes;


/**
 * Individual theme type
 */
export type AppTheme = (typeof AppThemes)[ThemeId];


/**
 * Fonts
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },

  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },

  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});


/**
 * Spacing
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;


export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;


export const MaxContentWidth = 800;