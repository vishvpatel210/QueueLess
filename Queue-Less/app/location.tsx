import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Palette } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import businessService from '../services/businessService';
import { NearbyBranchItem } from '../types/business';

export default function LocationScreen() {
  const router = useRouter();
  const [branches, setBranches] = useState<NearbyBranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<NearbyBranchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 19.0760,
    longitude: 72.8777,
  });
  const [locationLabel, setLocationLabel] = useState('Current GPS Location');

  useEffect(() => {
    initGPS();
  }, []);

  const initGPS = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 19.0760;
      let lng = 72.8777;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        setUserLocation({ latitude: lat, longitude: lng });
        setLocationLabel('Live Satellite GPS');
      }

      const data = await businessService.getNearbyBusinesses(lat, lng);
      setBranches(data || []);
      if (data && data.length > 0) {
        setSelectedBranch(data[0]);
      }
    } catch (err) {
      console.log('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!selectedBranch) return;
    const distanceKm = selectedBranch.distanceKm;
    if (distanceKm <= 5.0) {
      setIsCheckedIn(true);
      Alert.alert(
        'Check-In Verified! ✅',
        `Your presence is confirmed within ${distanceKm} km of ${selectedBranch.branchName}. Priority check-in updated!`
      );
    } else {
      Alert.alert(
        'Too Far Away 📍',
        `You are ${distanceKm} km away from ${selectedBranch.branchName}. Please move closer to the branch (within 5 km) to check in.`
      );
    }
  };

  const openInGoogleMaps = (branch: NearbyBranchItem) => {
    if (branch.location?.coordinates && branch.location.coordinates.length === 2) {
      const [lng, lat] = branch.location.coordinates;
      const label = encodeURIComponent(branch.branchName);
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Live GPS & Nearby Places" subtitle="GPS radar & proximity check-in" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User GPS Radar */}
        <Card style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <View style={styles.gpsRow}>
              <Ionicons name="navigate-circle" size={28} color={Palette.primary} />
              <View>
                <Text style={styles.gpsTitle}>{locationLabel}</Text>
                <Text style={styles.coordsText}>
                  {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                </Text>
              </View>
            </View>
            <Badge label="ACTIVE GPS" variant="success" />
          </View>
        </Card>

        {loading ? (
          <ActivityIndicator size="large" color={Palette.primary} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <>
            {/* Selected Branch Details */}
            {selectedBranch ? (
              <Card style={styles.branchCard}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.branchName}>{selectedBranch.branchName}</Text>
                    <Text style={styles.bizName}>
                      {selectedBranch.category} • {selectedBranch.businessName}
                    </Text>
                  </View>
                  <Badge label={`${selectedBranch.distanceKm} km away`} variant="primary" />
                </View>

                <Text style={styles.address}>{selectedBranch.address}</Text>

                {selectedBranch.location?.coordinates ? (
                  <View style={styles.coordsBox}>
                    <Ionicons name="compass" size={16} color={Palette.secondary} />
                    <Text style={styles.coordsLabel}>
                      Coordinates: {selectedBranch.location.coordinates[1].toFixed(4)}° N,{' '}
                      {selectedBranch.location.coordinates[0].toFixed(4)}° E
                    </Text>
                  </View>
                ) : null}

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.mapsBtn}
                    onPress={() => openInGoogleMaps(selectedBranch)}
                  >
                    <Ionicons name="map" size={16} color={Palette.primary} />
                    <Text style={styles.mapsBtnText}>Open in Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => {
                      router.push(`/business/${selectedBranch.businessId}` as any);
                    }}
                  >
                    <Text style={styles.bookBtnText}>Book Token →</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : null}

            {/* Check-In Proximity Card */}
            <Card style={styles.checkInCard}>
              <Text style={styles.cardTitle}>Proximity Check-In</Text>
              {isCheckedIn ? (
                <View style={styles.checkedInBox}>
                  <Ionicons name="checkmark-circle" size={36} color={Palette.success} />
                  <Text style={styles.checkedInTitle}>Arrival Verified</Text>
                  <Text style={styles.checkedInSubtitle}>
                    Your presence has been confirmed for priority token calling.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.infoText}>
                    Check in when you are near the branch (within 5 km) to ensure your token is called promptly.
                  </Text>
                  <Button
                    title="Verify Distance & Check-In"
                    onPress={handleCheckIn}
                    style={styles.checkInBtn}
                  />
                </View>
              )}
            </Card>

            {/* All Registered Branches List */}
            <Text style={styles.sectionHeading}>
              Nearby Registered Places ({branches.length})
            </Text>

            {branches.length === 0 ? (
              <Card style={{ padding: Spacing.lg, alignItems: 'center' }}>
                <Text style={{ color: Palette.mutedText }}>No businesses are available near you.</Text>
              </Card>
            ) : (
              branches.map((b) => {
                const isSelected = selectedBranch?.branchId === b.branchId;

                return (
                  <TouchableOpacity
                    key={b.branchId}
                    style={[styles.branchListItem, isSelected && styles.branchListItemActive]}
                    onPress={() => {
                      setSelectedBranch(b);
                      setIsCheckedIn(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{b.branchName}</Text>
                      <Text style={styles.itemCategory}>
                        {b.category} • {b.address}
                      </Text>
                    </View>
                    <Badge label={`${b.distanceKm} km`} variant={isSelected ? 'success' : 'primary'} />
                  </TouchableOpacity>
                );
              })
            )}
          </>
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
    paddingBottom: Spacing.xxl,
  },
  radarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  coordsText: {
    fontSize: 12,
    color: Palette.mutedText,
  },
  branchCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  branchName: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
  },
  bizName: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  address: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 200, 255, 0.08)',
    padding: 6,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  coordsLabel: {
    fontSize: 12,
    color: Palette.secondary,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.primary,
    gap: 6,
  },
  mapsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  bookBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Palette.primary,
    borderRadius: BorderRadius.md,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0D0E',
  },
  checkInCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: Palette.mutedText,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  checkInBtn: {
    marginTop: Spacing.xs,
  },
  checkedInBox: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkedInTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.success,
    marginTop: Spacing.xs,
  },
  checkedInSubtitle: {
    fontSize: 12,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginVertical: Spacing.sm,
  },
  branchListItem: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  branchListItemActive: {
    borderColor: Palette.primary,
    backgroundColor: 'rgba(0, 229, 155, 0.05)',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  itemCategory: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
});
