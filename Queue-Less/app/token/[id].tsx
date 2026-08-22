import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function DigitalTokenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<'WAITING' | 'CALLED' | 'COMPLETED' | 'CANCELLED'>('WAITING');

  const handleCancelToken = () => {
    Alert.alert(
      'Cancel Digital Token',
      'Are you sure you want to cancel your queue token? This action cannot be undone.',
      [
        { text: 'Keep Token', style: 'cancel' },
        {
          text: 'Cancel Token',
          style: 'destructive',
          onPress: () => setStatus('CANCELLED'),
        },
      ]
    );
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'CALLED':
        return <Badge label="YOUR TURN! PLEASE PROCEED" variant="warning" />;
      case 'COMPLETED':
        return <Badge label="SERVICE COMPLETED" variant="success" />;
      case 'CANCELLED':
        return <Badge label="TOKEN CANCELLED" variant="danger" />;
      case 'WAITING':
      default:
        return <Badge label="WAITING IN QUEUE" variant="primary" />;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Digital Pass" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.passCard}>
          <Text style={styles.passHeaderTitle}>QueueLess Digital Token</Text>
          <Text style={styles.passSubtitle}>Apex Health Clinic - Main Branch</Text>

          <View style={styles.statusRow}>{getStatusBadge()}</View>

          {/* Big Token Number */}
          <View style={styles.tokenDisplayContainer}>
            <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
            <Text style={styles.tokenNumber}>A-118</Text>
            <Text style={styles.serviceName}>General OPD Consultation</Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>3</Text>
              <Text style={styles.statLbl}>People Ahead</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>~15m</Text>
              <Text style={styles.statLbl}>Est. Wait Time</Text>
            </View>
          </View>
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Booking Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>For Person:</Text>
            <Text style={styles.infoValue}>Myself (John Doe)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking ID:</Text>
            <Text style={styles.infoValue}>BK-984210</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issued At:</Text>
            <Text style={styles.infoValue}>10:15 AM, Today</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        {status === 'WAITING' && (
          <Button
            title="Cancel Queue Token"
            variant="danger"
            onPress={handleCancelToken}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  passCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  passHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 1,
  },
  passSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  statusRow: {
    marginVertical: Spacing.md,
  },
  tokenDisplayContainer: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.mutedText,
    letterSpacing: 1.5,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Palette.primary,
    marginVertical: Spacing.xs,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  statLbl: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  detailsCard: {
    marginTop: Spacing.md,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: Palette.mutedText,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  cancelBtn: {
    marginTop: Spacing.xl,
  },
});
