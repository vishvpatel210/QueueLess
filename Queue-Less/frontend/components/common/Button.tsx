import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Palette } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Palette.card;
    switch (variant) {
      case 'secondary':
        return Palette.surface;
      case 'danger':
        return Palette.danger;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return Palette.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Palette.mutedText;
    switch (variant) {
      case 'outline':
        return Palette.primary;
      case 'secondary':
        return Palette.text;
      case 'danger':
        return '#FFFFFF';
      case 'primary':
      default:
        return '#0B0D0E'; // Dark text on lime button
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  outline: {
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Button;
