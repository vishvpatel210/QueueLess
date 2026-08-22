import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { ServiceItem } from '../../types/business';

const MOCK_SERVICES: ServiceItem[] = [
  {
    _id: 's1',
    branchId: 'br1',
    name: 'General OPD Consultation',
    description: 'General health checkup and medical prescription.',
    estimatedDurationMinutes: 15,
    price: 30,
    maxQueueCapacity: 50,
    prefix: 'A',
    isActive: true,
  },
  {
    _id: 's2',
    branchId: 'br1',
    name: 'Lab Diagnostics & Blood Test',
    description: 'Complete blood count, lipid profile, and fast diagnostics.',
    estimatedDurationMinutes: 10,
    price: 45,
    maxQueueCapacity: 100,
    prefix: 'B',
    isActive: true,
  },
];

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="Business Details" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Card style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={32} color={Palette.primary} />
          </View>
          <Text style={styles.businessTitle}>Apex Health Clinic</Text>
          <Text style={styles.businessCategory}>Healthcare • Main Branch</Text>
          <View style={styles.badgeRow}>
            <Badge label="4.9 ★ (128 reviews)" variant="primary" />
            <Badge label="OPEN NOW" variant="success" />
          </View>
        </Card>

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Palette.primary} />
            <Text style={styles.infoText}>104 Tech Boulevard, Downtown, Suite 400</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={Palette.primary} />
            <Text style={styles.infoText}>Operating Hours: 09:00 AM - 06:00 PM</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={Palette.primary} />
            <Text style={styles.infoText}>+1 (555) 234-5678</Text>
          </View>
        </Card>

        {/* Services List */}
        <Text style={styles.sectionTitle}>Available Queue Services</Text>

        {MOCK_SERVICES.map((srv) => (
          <Card key={srv._id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{srv.name}</Text>
              <Text style={styles.servicePrice}>${srv.price}</Text>
            </View>

            {srv.description ? (
              <Text style={styles.serviceDesc}>{srv.description}</Text>
            ) : null}

            <View style={styles.serviceFooter}>
              <Text style={styles.durationText}>
                ⏱ Est. {srv.estimatedDurationMinutes} mins per token
              </Text>
              <Button
                title="Select Service"
                onPress={() => router.push(`/service/${srv._id}` as any)}
                style={styles.selectBtn}
              />
            </View>
          </Card>
        ))}
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
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  businessTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
  },
  businessCategory: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  infoCard: {
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: Palette.text,
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginVertical: Spacing.sm,
  },
  serviceCard: {
    marginVertical: Spacing.xs,
    padding: Spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
  },
  serviceDesc: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: Spacing.xs,
  },
  serviceFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  durationText: {
    fontSize: 13,
    color: Palette.mutedText,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  selectBtn: {
    height: 44,
  },
});
