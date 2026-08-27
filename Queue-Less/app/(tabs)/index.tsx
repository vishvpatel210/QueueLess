import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { BusinessCategory, Business } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import CategoryBadge from '../../components/business/CategoryBadge';
import BusinessCard from '../../components/business/BusinessCard';
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

const MOCK_FALLBACK: Business[] = [
  {
    _id: 'b1',
    name: 'City Care Super Specialty Hospital',
    description: '24/7 OPD, emergency consultation, lab diagnostics & cardiology care.',
    category: 'Healthcare',
    ownerId: 'admin1',
    rating: 4.9,
    reviewCount: 342,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b2',
    name: 'Style Studio Salon & Spa',
    description: 'Premium hair styling, facials, skin care, and luxury spa treatments.',
    category: 'Salon & Spa',
    ownerId: 'admin2',
    rating: 4.8,
    reviewCount: 189,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b3',
    name: 'HDFC Express Banking Center',
    description: 'Account opening, loan consultations, forex, and express teller counters.',
    category: 'Bank & Finance',
    ownerId: 'admin3',
    rating: 4.7,
    reviewCount: 512,
    createdAt: new Date().toISOString(),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLiveBusinesses();
  }, [selectedCategory, search]);

  const fetchLiveBusinesses = async () => {
    try {
      setLoading(true);
      const data = await businessService.getBusinesses(
        selectedCategory === 'All' ? undefined : selectedCategory,
        search ? search : undefined
      );
      if (data && data.length > 0) {
        setBusinesses(data);
      } else {
        setBusinesses(MOCK_FALLBACK);
      }
    } catch (e) {
      // If API server is starting or offline, use fallback list
      const filteredFallback = MOCK_FALLBACK.filter((b) => {
        const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      });
      setBusinesses(filteredFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user ? user.name.split(' ')[0] : 'Guest'} 👋
            </Text>
            <Text style={styles.headerSubtitle}>Queue digital, skip the crowd.</Text>
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
          placeholder="Search clinic, salon, bank, service..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchBox}
        />

        {/* Active Queue Widget (Live) */}
        <Card style={styles.activeTokenCard}>
          <View style={styles.activeTokenHeader}>
            <Badge label="ACTIVE TOKEN" variant="primary" />
            <Text style={styles.liveIndicator}>● Live Sync</Text>
          </View>
          <Text style={styles.activeTokenNumber}>A-102</Text>
          <Text style={styles.activeBranchName}>City Care Hospital - OPD Counter 1</Text>
          <View style={styles.activeTokenFooter}>
            <Text style={styles.positionText}>Position: <Text style={{ color: Palette.primary }}>#2 in line</Text></Text>
            <Text style={styles.positionText}>Est. Wait: ~15 mins</Text>
          </View>
        </Card>

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

        {/* Nearby Businesses */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Live Services & Shops</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Palette.primary} size="large" style={{ marginVertical: Spacing.md }} />
        ) : (
          businesses.map((b) => (
            <BusinessCard
              key={b._id}
              business={b}
              onPress={() => router.push(`/business/${b._id}` as any)}
            />
          ))
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
    paddingTop: Spacing.xl,
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
  headerSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
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
    marginBottom: Spacing.md,
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
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
  },
});
