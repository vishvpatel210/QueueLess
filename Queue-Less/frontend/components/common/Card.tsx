import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Palette } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'surface' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'surface':
        return Palette.surface;
      case 'bordered':
        return 'transparent';
      case 'default':
      default:
        return Palette.card;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: getBackgroundColor() },
        variant === 'bordered' && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Palette.border,
  },
});

export default Card;
