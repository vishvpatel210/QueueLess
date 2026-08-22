import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function QueueTabScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="My Live Token" subtitle="Real-time position tracker" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.activeCard}>
          <View style={styles.headerRow}>
            <Badge label="WAITING IN LINE" variant="primary" />
            <Text style={styles.syncStatus}>● Live Sync</Text>
          </View>

          <Text style={styles.tokenNumber}>A-118</Text>
          <Text style={styles.serviceTitle}>General OPD Consultation</Text>
          <Text style={styles.branchName}>Apex Health Clinic - Main Branch</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaBox}>
              <Text style={styles.metaVal}>3</Text>
              <Text style={styles.metaLbl}>People Ahead</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaVal}>~15m</Text>
              <Text style={styles.metaLbl}>Est. Wait Time</Text>
            </View>
          </View>

          <Button
            title="View Full Digital Pass"
            onPress={() => router.push('/token/t101' as any)}
            style={styles.actionBtn}
          />
        </Card>
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
  activeCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatus: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '700',
  },
  tokenNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: Palette.primary,
    marginVertical: Spacing.xs,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  branchName: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  metaBox: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  metaVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  metaLbl: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  actionBtn: {
    marginTop: Spacing.sm,
  },
});
