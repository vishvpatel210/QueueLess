import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Business, NearbyBranchItem } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface BusinessCardProps {
  business?: Business;
  item?: NearbyBranchItem;
  onPress: () => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  item,
  onPress,
}) => {
  const displayName = item ? item.branchName : business?.name || '';
  const displayCategory = item ? item.business.category : business?.category || '';
  const displayRating = item ? item.business.rating : business?.rating || 4.8;
  const displayDescription = item ? item.address : business?.description || '';
  const distance = item ? `${item.distanceKm} km` : null;
  const waitingCount = item?.queueSummary?.totalWaiting ?? 0;
  const estWait = item?.queueSummary?.estimatedWaitMinutes ?? 0;
  const servingToken = item?.queueSummary?.currentServingToken;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={24} color={Palette.primary} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.category}>
              {displayCategory} {item ? `• ${item.business.name}` : ''}
            </Text>
          </View>
          {distance ? (
            <Badge label={distance} variant="primary" />
          ) : (
            <Badge label={`${displayRating} ★`} variant="primary" />
          )}
        </View>

        {displayDescription ? (
          <Text style={styles.description} numberOfLines={2}>
            {displayDescription}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={Palette.mutedText} />
            <Text style={styles.metaText}>
              {waitingCount > 0 ? `${waitingCount} waiting in queue` : 'No queue wait'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={Palette.mutedText} />
            <Text style={styles.metaText}>
              {estWait > 0 ? `~${estWait} min wait` : 'Immediate'}
            </Text>
          </View>

          {servingToken ? (
            <View style={styles.metaItem}>
              <Ionicons name="ticket-outline" size={16} color={Palette.primary} />
              <Text style={[styles.metaText, { color: Palette.primary, fontWeight: '700' }]}>
                {servingToken}
              </Text>
            </View>
          ) : null}
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
