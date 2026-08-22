import { Platform } from 'react-native';
import { Colors as AppColors, Palette } from './Colors';

export const Colors = AppColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Palette.text,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Palette.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Palette.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Palette.text,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Palette.mutedText,
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
