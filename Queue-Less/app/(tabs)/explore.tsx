import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BusinessCategory, Business } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
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

const EXPLORE_FALLBACK: Business[] = [
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

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');
  const [businesses, setBusinesses] = useState<Business[]>(EXPLORE_FALLBACK);
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
        setBusinesses(EXPLORE_FALLBACK);
      }
    } catch (e) {
      const filtered = EXPLORE_FALLBACK.filter((b) => {
        const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
      });
      setBusinesses(filtered);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Explore Services" subtitle="Find real shops & hospitals near you" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          placeholder="Search by shop, clinic or hospital name..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchBox}
        />

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

        <Text style={styles.resultsCount}>{businesses.length} places available for live booking</Text>

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
  },
  searchBox: {
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: 14,
    color: Palette.mutedText,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
});
