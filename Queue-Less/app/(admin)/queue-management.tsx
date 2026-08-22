import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function QueueManagementScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header title="Queue Settings" subtitle="Branch Configuration" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Business & Branch Setup</Text>
          <Text style={styles.subtitle}>Apex Health Clinic - Main Branch</Text>
          <Badge label="ACTIVE BRANCH" variant="success" style={styles.badge} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Manage Queue Services</Text>

          <View style={styles.serviceItem}>
            <View>
              <Text style={styles.serviceName}>General OPD Consultation</Text>
              <Text style={styles.serviceDetails}>Prefix: A • Est Duration: 15 mins</Text>
            </View>
            <Badge label="ACTIVE" variant="primary" />
          </View>

          <View style={styles.serviceItem}>
            <View>
              <Text style={styles.serviceName}>Lab Diagnostics & Blood Test</Text>
              <Text style={styles.serviceDetails}>Prefix: B • Est Duration: 10 mins</Text>
            </View>
            <Badge label="ACTIVE" variant="primary" />
          </View>

          <Button
            title="+ Add New Service"
            variant="outline"
            onPress={() => {}}
            style={styles.addBtn}
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
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  badge: {
    marginTop: Spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  serviceDetails: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  addBtn: {
    marginTop: Spacing.md,
  },
});
