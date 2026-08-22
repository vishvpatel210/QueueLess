import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [forWhom, setForWhom] = useState<'myself' | 'other'>('myself');

  return (
    <View style={styles.container}>
      <Header title="Join Queue" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.serviceTitle}>General OPD Consultation</Text>
          <Text style={styles.branchName}>Apex Health Clinic - Main Branch</Text>
          <Badge label="QUEUE OPEN" variant="success" style={styles.badge} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>People Ahead</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>~15m</Text>
              <Text style={styles.statLabel}>Est. Wait Time</Text>
            </View>
          </View>
        </Card>

        {/* Appointment For Switcher */}
        <Text style={styles.sectionTitle}>Appointment For</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchOption,
              forWhom === 'myself' && styles.switchActive,
            ]}
            onPress={() => setForWhom('myself')}
          >
            <Ionicons
              name="person"
              size={18}
              color={forWhom === 'myself' ? '#0B0D0E' : Palette.mutedText}
            />
            <Text
              style={[
                styles.switchText,
                forWhom === 'myself' && styles.switchTextActive,
              ]}
            >
              Myself
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchOption,
              forWhom === 'other' && styles.switchActive,
            ]}
            onPress={() => {
              setForWhom('other');
              router.push('/contacts' as any);
            }}
          >
            <Ionicons
              name="people"
              size={18}
              color={forWhom === 'other' ? '#0B0D0E' : Palette.mutedText}
            />
            <Text
              style={[
                styles.switchText,
                forWhom === 'other' && styles.switchTextActive,
              ]}
            >
              Someone Else
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Confirm & Generate Token"
          onPress={() => router.push('/token/t101' as any)}
          style={styles.confirmBtn}
        />
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
  card: {
    padding: Spacing.lg,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  branchName: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  badge: {
    marginTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  switchOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  switchActive: {
    backgroundColor: Palette.primary,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  switchTextActive: {
    color: '#0B0D0E',
  },
  confirmBtn: {
    marginTop: Spacing.xl,
  },
});
