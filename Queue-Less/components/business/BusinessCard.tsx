import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Business } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface BusinessCardProps {
  business: Business;
  onPress: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onPress,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={24} color={Palette.primary} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{business.name}</Text>
            <Text style={styles.category}>{business.category}</Text>
          </View>
          <Badge label={`${business.rating || '4.8'} ★`} variant="primary" />
        </View>

        {business.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {business.description}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={Palette.mutedText} />
            <Text style={styles.metaText}>~12 min wait</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={Palette.mutedText} />
            <Text style={styles.metaText}>4 ahead</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  category: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Palette.mutedText,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default BusinessCard;
