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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { BusinessCategory, NearbyBranchItem } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CategoryBadge from '../../components/business/CategoryBadge';
import businessService from '../../services/businessService';

const CATEGORIES: BusinessCategory[] = [
  'All',
  'Healthcare',
  'Salon & Spa',
  'Bank & Finance',
  'Retail',
  'Dining & Cafe',
  'Government Services',
  'Service Center',
];

export default function ExploreScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');
  const [branches, setBranches] = useState<NearbyBranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<NearbyBranchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 19.0760,
    longitude: 72.8777,
  });
  const [locationName, setLocationName] = useState('Current GPS');

  useEffect(() => {
    initGPS();
  }, []);

  useEffect(() => {
    fetchRegisteredBranches();
  }, [selectedCategory, search, userCoords]);

  const initGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setLocationName('Live GPS Location');
      }
    } catch (e) {
      console.log('GPS read error:', e);
    }
  };

  const fetchRegisteredBranches = async () => {
    try {
      setLoading(true);
      const data = await businessService.getNearbyBusinesses(
        userCoords.latitude,
        userCoords.longitude,
        selectedCategory === 'All' ? undefined : selectedCategory,
        search ? search : undefined,
        50000
      );
      setBranches(data || []);
      if (data && data.length > 0) {
        setSelectedBranch(data[0]);
      } else {
        setSelectedBranch(null);
      }
    } catch (e) {
      console.log('Error loading branches:', e);
      setBranches([]);
    } finally {
      setLoading(false);
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

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Healthcare':
        return 'medkit';
      case 'Salon & Spa':
        return 'sparkles';
      case 'Bank & Finance':
        return 'card';
      case 'Government Services':
        return 'business';
      default:
        return 'storefront';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Explore Live Locations"
        subtitle="Only registered hospitals, salons & shops"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Input */}
        <Input
          placeholder="Search registered hospital, clinic or shop..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchBox}
        />

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryBadge
              key={cat}
              category={cat}
              selected={selectedCategory === cat}
              onSelect={setSelectedCategory}
            />
          ))}
        </ScrollView>

        {/* View Mode Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.resultsCount}>
            {branches.length} registered locations found
          </Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons
                name="map"
                size={16}
                color={viewMode === 'map' ? '#0B0D0E' : Palette.mutedText}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'map' && styles.toggleTextActive,
                ]}
              >
                Map Radar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? '#0B0D0E' : Palette.mutedText}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'list' && styles.toggleTextActive,
                ]}
              >
                List View
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            color={Palette.primary}
            size="large"
            style={{ marginVertical: Spacing.xl }}
          />
        ) : branches.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="location-outline" size={48} color={Palette.mutedText} />
            <Text style={styles.emptyTitle}>No QueueLess businesses nearby</Text>
            <Text style={styles.emptySubtitle}>
              {search || selectedCategory !== 'All'
                ? 'No registered QueueLess businesses matched your filter or search query.'
                : 'No businesses have registered on QueueLess in this area yet. Only businesses that have onboarded their branches appear on this live radar.'}
            </Text>
          </Card>
        ) : viewMode === 'map' ? (
          /* Interactive Registered Map Radar View */
          <View style={styles.mapSection}>
            {/* Visual Radar Card */}
            <Card style={styles.radarCard}>
              <View style={styles.radarHeader}>
                <View style={styles.userLocationBadge}>
                  <Ionicons name="navigate" size={16} color={Palette.primary} />
                  <Text style={styles.userLocationText}>
                    GPS: {locationName}
                  </Text>
                </View>
                <Badge label="LIVE GPS RADAR" variant="primary" />
              </View>

              {/* Interactive Radar Grid with Registered Pins */}
              <View style={styles.radarGrid}>
                <View style={styles.radarRing1} />
                <View style={styles.radarRing2} />
                <View style={styles.userCenterPin}>
                  <Ionicons name="radio-button-on" size={24} color={Palette.primary} />
                  <Text style={styles.userCenterText}>You</Text>
                </View>

                {/* Plot registered pins */}
                {branches.slice(0, 6).map((branch, index) => {
                  const isSelected = selectedBranch?._id === branch._id;
                  const angles = [45, 120, 210, 290, 160, 330];
                  const angle = angles[index % angles.length];
                  const radius = 60 + (index % 3) * 35;
                  const rad = (angle * Math.PI) / 180;
                  const x = radius * Math.cos(rad);
                  const y = radius * Math.sin(rad);

                  return (
                    <TouchableOpacity
                      key={branch._id}
                      style={[
                        styles.mapPin,
                        {
                          transform: [{ translateX: x }, { translateY: y }],
                        },
                        isSelected && styles.mapPinSelected,
                      ]}
                      onPress={() => setSelectedBranch(branch)}
                    >
                      <Ionicons
                        name={getCategoryIcon(branch.business?.category) as any}
                        size={16}
                        color={isSelected ? '#0B0D0E' : Palette.text}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.radarHint}>
                Tap any marker above to view registered details & GPS coordinates
              </Text>
            </Card>

            {/* Selected Branch Details Card */}
            {selectedBranch ? (
              <Card style={styles.selectedCard}>
                <View style={styles.selectedHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedName}>{selectedBranch.branchName}</Text>
                    <Text style={styles.selectedCategory}>
                      {selectedBranch.business?.category || 'Registered Place'} •{' '}
                      {selectedBranch.business?.name || 'Main Business'}
                    </Text>
                  </View>
                  <Badge
                    label={`${selectedBranch.distanceKm} km`}
                    variant="success"
                  />
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={Palette.primary} />
                  <Text style={styles.infoText}>{selectedBranch.address}</Text>
                </View>

                {selectedBranch.location?.coordinates ? (
                  <View style={styles.coordsRow}>
                    <Ionicons name="compass-outline" size={16} color={Palette.secondary} />
                    <Text style={styles.coordsText}>
                      Coordinates: {selectedBranch.location.coordinates[1].toFixed(4)}° N,{' '}
                      {selectedBranch.location.coordinates[0].toFixed(4)}° E
                    </Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color={Palette.primary} />
                  <Text style={styles.infoText}>
                    Hours: {selectedBranch.operatingHours?.open || '09:00'} -{' '}
                    {selectedBranch.operatingHours?.close || '18:00'}
                  </Text>
                </View>

                {selectedBranch.phone ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={16} color={Palette.primary} />
                    <Text style={styles.infoText}>{selectedBranch.phone}</Text>
                  </View>
                ) : null}

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.directionsBtn}
                    onPress={() => openInGoogleMaps(selectedBranch)}
                  >
                    <Ionicons name="navigate" size={16} color={Palette.primary} />
                    <Text style={styles.directionsText}>Google Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookTokenBtn}
                    onPress={() => {
                      router.push(`/business/${selectedBranch.business._id}` as any);
                    }}
                  >
                    <Text style={styles.bookTokenText}>Book Token →</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : null}
          </View>
        ) : (
          /* List View */
          branches.map((branch) => {
            return (
              <Card key={branch._id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={getCategoryIcon(branch.business?.category) as any}
                      size={24}
                      color={Palette.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.listBranchName}>{branch.branchName}</Text>
                    <Text style={styles.listCategoryName}>
                      {branch.business?.category || 'Registered Place'} • {branch.business?.name || ''}
                    </Text>
                  </View>
                  <Badge label={`${branch.distanceKm} km`} variant="primary" />
                </View>

                <Text style={styles.listAddress}>{branch.address}</Text>

                <View style={styles.listFooter}>
                  <TouchableOpacity
                    style={styles.mapsLink}
                    onPress={() => openInGoogleMaps(branch)}
                  >
                    <Ionicons name="map-outline" size={16} color={Palette.primary} />
                    <Text style={styles.mapsLinkText}>View Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewServicesBtn}
                    onPress={() => {
                      router.push(`/business/${branch.business._id}` as any);
                    }}
                  >
                    <Text style={styles.viewServicesText}>View Services & Queues →</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
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
  searchBox: {
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: 13,
    color: Palette.mutedText,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: Palette.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  toggleTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  mapSection: {
    marginBottom: Spacing.lg,
  },
  radarCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  radarGrid: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 229, 155, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.md,
  },
  radarRing1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.2)',
  },
  radarRing2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.25)',
  },
  userCenterPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  userCenterText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary,
  },
  mapPin: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.card,
    borderWidth: 2,
    borderColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPinSelected: {
    backgroundColor: Palette.primary,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  radarHint: {
    fontSize: 12,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  selectedCard: {
    padding: Spacing.lg,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  selectedCategory: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    fontSize: 13,
    color: Palette.text,
    flex: 1,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    backgroundColor: 'rgba(0, 200, 255, 0.08)',
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  coordsText: {
    fontSize: 12,
    color: Palette.secondary,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  directionsBtn: {
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
  directionsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  bookTokenBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Palette.primary,
    borderRadius: BorderRadius.md,
  },
  bookTokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0D0E',
  },
  listCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listBranchName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
  },
  listCategoryName: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  listAddress: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: Spacing.sm,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  mapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapsLinkText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },
  viewServicesBtn: {
    backgroundColor: 'rgba(0, 229, 155, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  viewServicesText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Palette.surface,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
});
