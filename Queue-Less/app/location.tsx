import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import locationService from '../services/locationService';

export default function LocationScreen() {
  const router = useRouter();
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const branchCoords = { latitude: 37.7749, longitude: -122.4194 };
  const userCoords = { latitude: 37.7780, longitude: -122.4180 };
  const distanceKm = locationService.calculateDistanceKm(userCoords, branchCoords);

  const handleCheckIn = () => {
    if (distanceKm <= 2.0) {
      setIsCheckedIn(true);
      Alert.alert(
        'Check-In Verified!',
        `Your location is confirmed within ${distanceKm} km of Apex Health Clinic.`
      );
    } else {
      Alert.alert(
        'Too Far Away',
        `You are ${distanceKm} km away. Please move closer to the branch to check in.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Location Verification" subtitle="Branch distance & check-in" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.branchName}>Apex Health Clinic</Text>
            <Badge label={`${distanceKm} km away`} variant="primary" />
          </View>

          <Text style={styles.address}>104 Tech Boulevard, Downtown, Suite 400</Text>

          {/* Map Graphic Box */}
          <View style={styles.mapBox}>
            <Ionicons name="navigate-circle" size={48} color={Palette.primary} />
            <Text style={styles.mapText}>Live GPS Verification Radar</Text>
            <Text style={styles.coordsText}>Your Position: 37.7780° N, 122.4180° W</Text>
          </View>
        </Card>

        <Card style={styles.checkInCard}>
          <Text style={styles.cardTitle}>Location Check-In Status</Text>

          {isCheckedIn ? (
            <View style={styles.checkedInBox}>
              <Ionicons name="checkmark-circle" size={36} color={Palette.success} />
              <Text style={styles.checkedInTitle}>Checked-In Successfully</Text>
              <Text style={styles.checkedInSubtitle}>
                The branch staff has been notified of your physical arrival.
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.infoText}>
                Confirming your physical proximity keeps your token prioritized when your turn arrives.
              </Text>

              <Button
                title="Verify Distance & Check-In"
                onPress={handleCheckIn}
                style={styles.checkInBtn}
              />
            </View>
          )}
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
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchName: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  address: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 4,
  },
  mapBox: {
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  mapText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
    marginTop: Spacing.xs,
  },
  coordsText: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  checkInCard: {
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Palette.mutedText,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  checkInBtn: {
    marginTop: Spacing.xs,
  },
  checkedInBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  checkedInTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.success,
    marginTop: Spacing.xs,
  },
  checkedInSubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: 4,
  },
});
