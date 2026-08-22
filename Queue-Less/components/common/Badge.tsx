import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Palette } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(125, 220, 138, 0.15)', text: Palette.success };
      case 'warning':
        return { bg: 'rgba(255, 184, 107, 0.15)', text: Palette.warning };
      case 'danger':
        return { bg: 'rgba(255, 107, 107, 0.15)', text: Palette.danger };
      case 'muted':
        return { bg: 'rgba(156, 163, 175, 0.15)', text: Palette.mutedText };
      case 'primary':
      default:
        return { bg: 'rgba(199, 243, 107, 0.15)', text: Palette.primary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default Badge;
