import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { BusinessCategory, NearbyBranchItem } from '../../types/business';
import { TokenItem } from '../../types/queue';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import CategoryBadge from '../../components/business/CategoryBadge';
import BusinessCard from '../../components/business/BusinessCard';
import businessService from '../../services/businessService';
import queueService from '../../services/queueService';

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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');
  const [nearbyBranches, setNearbyBranches] = useState<NearbyBranchItem[]>([]);
  const [activeToken, setActiveToken] = useState<TokenItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 19.0760,
    longitude: 72.8777,
  });
  const [locationStatus, setLocationStatus] = useState<string>('Detecting GPS...');

  useEffect(() => {
    initLocationAndFetch();
    fetchActiveToken();
  }, []);

  useEffect(() => {
    fetchNearby();
  }, [selectedCategory, search, userCoords]);

  const initLocationAndFetch = async () => {
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
        setLocationStatus('GPS Active');
      } else {
        setLocationStatus('Location access off');
      }
    } catch (e) {
      setLocationStatus('GPS unavailable');
    }
  };

  const fetchActiveToken = async () => {
    try {
      const res = await queueService.getMyActiveTokens();
      const tokens = res || [];
      if (tokens.length > 0) {
        const t: any = tokens[0];
        setActiveToken({
          ...t,
          branchName: t.queueId?.branchId?.name || t.branchName || '',
        } as any);
      } else {
        setActiveToken(null);
      }
    } catch (e) {
      setActiveToken(null);
    }
  };

  const fetchNearby = async () => {
    try {
      setLoading(true);
      const data = await businessService.getNearbyBusinesses(
        userCoords.latitude,
        userCoords.longitude,
        selectedCategory === 'All' ? undefined : selectedCategory,
        search ? search : undefined,
        50000 // 50km radius
      );
      setNearbyBranches(data || []);
    } catch (e) {
      console.log('Error fetching nearby businesses:', e);
      setNearbyBranches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initLocationAndFetch();
    fetchNearby();
  }, [userCoords, selectedCategory, search]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user ? user.name.split(' ')[0] : 'Guest'} 👋
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={Palette.primary} />
              <Text style={styles.locationText}>{locationStatus}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.qrScannerButton}
            onPress={() => router.push('/scanner' as any)}
          >
            <Ionicons name="qr-code-outline" size={24} color={Palette.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <Input
          placeholder="Search registered clinic, salon, shop..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchBox}
        />

        {/* Active Token Card (Only rendered if customer has a real active token) */}
        {activeToken ? (
          <Card style={styles.activeTokenCard}>
            <View style={styles.activeTokenHeader}>
              <Badge label="YOUR ACTIVE TOKEN" variant="primary" />
              <Text style={styles.liveIndicator}>● Live Sync</Text>
            </View>
            <Text style={styles.activeTokenNumber}>{activeToken.tokenNumber}</Text>
            <Text style={styles.activeBranchName}>
              {(activeToken as any).branchName || 'Registered Branch'}
            </Text>
            <View style={styles.activeTokenFooter}>
              <Text style={styles.positionText}>
                People ahead: <Text style={{ color: Palette.primary }}>{activeToken.estimatedWaitTimeMinutes}m wait</Text>
              </Text>
              <TouchableOpacity onPress={() => router.push(`/token/${activeToken._id}` as any)}>
                <Text style={styles.viewPassLink}>View Pass →</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {/* Category Horizontal Scroll */}
        <Text style={styles.sectionTitle}>Categories</Text>
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

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Live Places Nearby ({nearbyBranches.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAllText}>Radar View</Text>
          </TouchableOpacity>
        </View>

        {/* List of Real Database Businesses or Empty State */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Palette.primary} size="large" />
            <Text style={styles.loadingText}>Searching registered businesses nearby...</Text>
          </View>
        ) : nearbyBranches.length === 0 ? (
          <Card style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="location-outline" size={36} color={Palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>No QueueLess businesses nearby</Text>
            <Text style={styles.emptySubtitle}>
              {search || selectedCategory !== 'All'
                ? 'No registered places matched your search or category filter.'
                : 'No registered clinics, salons, or businesses found in your area yet. Once a business registers on QueueLess, it will appear here live with real wait times.'}
            </Text>
            <Button
              title="Refresh Location & Search"
              onPress={onRefresh}
              style={styles.refreshBtn}
            />
            <View style={styles.bizOwnerPromptRow}>
              <Text style={styles.bizOwnerPromptText}>Own a clinic, salon or shop? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register-admin' as any)}>
                <Text style={styles.bizOwnerPromptLink}>Register Business →</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          nearbyBranches.map((item) => (
            <BusinessCard
              key={item._id}
              item={item}
              onPress={() => router.push(`/business/${item.business._id}` as any)}
            />
          ))
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: Palette.mutedText,
    fontWeight: '600',
  },
  qrScannerButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  searchBox: {
    marginBottom: Spacing.sm,
  },
  activeTokenCard: {
    backgroundColor: Palette.surface,
    borderColor: Palette.primary,
    borderWidth: 1,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  activeTokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '700',
  },
  activeTokenNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Palette.primary,
    marginVertical: Spacing.xs,
  },
  activeBranchName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  activeTokenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  positionText: {
    fontSize: 13,
    color: Palette.mutedText,
    fontWeight: '600',
  },
  viewPassLink: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginVertical: Spacing.sm,
  },
  categoryScroll: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  seeAllText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: Palette.mutedText,
    marginTop: Spacing.sm,
    fontSize: 13,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.sm,
    backgroundColor: Palette.surface,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  refreshBtn: {
    width: '100%',
  },
  bizOwnerPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  bizOwnerPromptText: {
    fontSize: 12,
    color: Palette.mutedText,
  },
  bizOwnerPromptLink: {
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '700',
  },
});
