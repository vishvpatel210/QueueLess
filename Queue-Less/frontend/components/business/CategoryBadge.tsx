import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BusinessCategory } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';

interface CategoryBadgeProps {
  category: BusinessCategory;
  selected: boolean;
  onSelect: (category: BusinessCategory) => void;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  selected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.badge,
        selected ? styles.selectedBadge : styles.unselectedBadge,
      ]}
      onPress={() => onSelect(category)}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.selectedText : styles.unselectedText,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs + 2,
    borderWidth: 1,
  },
  selectedBadge: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  unselectedBadge: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedText: {
    color: '#0B0D0E',
  },
  unselectedText: {
    color: Palette.mutedText,
  },
});

export default CategoryBadge;
