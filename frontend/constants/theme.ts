// /**
//  * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
//  * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
//  */

import { Platform } from 'react-native';

// ─── Primärfärger: Blå/Cyan gradient-känsla ─────
export const Palette = {
  // Primär — Blå/Cyan
  primary:        '#2BBFFF',
  primaryDark:    '#0099DD',
  primaryLight:   '#E0F7FF',

  // Sekundär — Lila accent
  secondary:      '#7C6FFF',
  secondaryLight: '#EEECFF',

  // Framgång — Grön mint
  success:        '#00C896',
  successLight:   '#D4F7EE',

  // Varning — Amber
  warning:        '#FFB830',
  warningLight:   '#FFF4D6',

  // Fara — Korall
  danger:         '#FF5C7C',
  dangerLight:    '#FFE4EB',

  // Streak — Orange
  streak:         '#FF8C42',
  streakLight:    '#FFE8D6',

  // Tips - Gul
  tips:         '#EBD83D',
  tipsLight:    '#FFFDE5',

  // Neutrala
  white:   '#FFFFFF',
  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray900: '#0F172A',
};

// ─── Temafärger ─────────────────────────────────
export const Colors = {
  light: {
    text:            Palette.gray900,
    background:      Palette.white,
    tint:            Palette.primary,
    icon:            Palette.gray500,
    tabIconDefault:  Palette.gray400,
    tabIconSelected: Palette.primary,
    card:            Palette.gray50,
    border:          Palette.gray200,
    subtitle:        Palette.gray500,
  },
  dark: {
    text:            '#F1F5F9',
    background:      '#0D1117',
    tint:            Palette.primary,
    icon:            '#8B949E',
    tabIconDefault:  '#8B949E',
    tabIconSelected: Palette.primary,
    card:            '#161B22',
    border:          '#21262D',
    subtitle:        '#8B949E',
  },
};

// ─── Typografi ──────────────────────────────────
export const Typography = {
  xs:      11,
  sm:      13,
  base:    15,
  md:      16,
  lg:      18,
  xl:      20,
  xxl:     24,
  xxxl:    30,
  display: 36,

  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

// ─── Spacing ────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
  xxxxl: 64,
};

// ─── Border radius — rund och mjuk ──────────────
export const Radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
};

// ─── Shadows ────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: '#2BBFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Fonts ──────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});

// ─── Habit färger ───────────────────────────────
export const COLORS_DEFAULT = [
  '#2BBFFF', '#7C6FFF', '#00C896', '#FF5C7C',
  '#FFB830', '#FF8C42', '#45B7D1', '#DDA0DD',
];

export const COLORS_MORE = [
  '#FF0000', '#FF4500', '#FF6B6B', '#FF69B4',
  '#FF1493', '#C71585', '#9400D3', '#8B00FF',
  '#4B0082', '#0000FF', '#0099DD', '#00BFFF',
  '#00CED1', '#00FA9A', '#00C896', '#008000',
  '#6B8E23', '#BDB76B', '#FFD700', '#FFA500',
  '#D2691E', '#A0522D', '#708090', '#2F4F4F',
  '#000000', '#333333', '#666666', '#999999',
  '#CCCCCC', '#FFFFFF', '#F5F5DC', '#FAEBD7',
];