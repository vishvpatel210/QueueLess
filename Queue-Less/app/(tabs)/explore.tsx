import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BusinessCategory, Business } from '../../types/business';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import CategoryBadge from '../../components/business/CategoryBadge';
import BusinessCard from '../../components/business/BusinessCard';

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

const EXPLORE_BUSINESSES: Business[] = [
  {
    _id: 'b1',
    name: 'Apex Health Clinic',
    description: 'Outpatient care, blood tests, and general consultations.',
    category: 'Healthcare',
    ownerId: 'admin1',
    rating: 4.9,
    reviewCount: 128,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b2',
    name: 'Luxe Salon & Spa',
    description: 'Modern hair styling, manicures, and relaxation therapies.',
    category: 'Salon & Spa',
    ownerId: 'admin2',
    rating: 4.8,
    reviewCount: 94,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b3',
    name: 'Metro National Bank',
    description: 'Express teller services, loan consultations, and account support.',
    category: 'Bank & Finance',
    ownerId: 'admin3',
    rating: 4.6,
    reviewCount: 210,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b4',
    name: 'TechCare Service Hub',
    description: 'Express mobile repairs, laptop servicing, and hardware diagnostics.',
    category: 'Service Center',
    ownerId: 'admin4',
    rating: 4.7,
    reviewCount: 75,
    createdAt: new Date().toISOString(),
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');

  const filtered = EXPLORE_BUSINESSES.filter((b) => {
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <Header title="Explore Services" subtitle="Find queues near you" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          placeholder="Search by business name or service..."
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

        <Text style={styles.resultsCount}>{filtered.length} businesses found</Text>

        {filtered.map((b) => (
          <BusinessCard
            key={b._id}
            business={b}
            onPress={() => router.push(`/business/${b._id}` as any)}
          />
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
