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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import businessService from '../../services/businessService';
import branchService from '../../services/branchService';
import { Business, Branch } from '../../types/business';
import { ServiceWithQueue } from '../../services/serviceService';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<ServiceWithQueue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBusinessDetails();
    }
  }, [id]);

  const loadBusinessDetails = async () => {
    try {
      setLoading(true);
      const bizData: any = await businessService.getBusinessById(id);
      setBusiness(bizData);

      const branchList: Branch[] = bizData.branches || [];
      setBranches(branchList);

      if (branchList.length > 0) {
        const firstBranch = branchList[0];
        setSelectedBranch(firstBranch);
        await loadBranchServices(firstBranch._id);
      }
    } catch (err) {
      console.log('Error loading business:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchServices = async (branchId: string) => {
    try {
      const srvList = await branchService.getServicesByBranch(branchId);
      setServices(srvList);
    } catch (err) {
      console.log('Error loading services:', err);
      setServices([]);
    }
  };

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch);
    await loadBranchServices(branch._id);
  };

  const openInGoogleMaps = (branch: Branch) => {
    if (branch.location?.coordinates && branch.location.coordinates.length === 2) {
      const [lng, lat] = branch.location.coordinates;
      const label = encodeURIComponent(branch.name);
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading registered business...</Text>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.errorText}>Business not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Registered Place Details" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <Card style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={32} color={Palette.primary} />
          </View>
          <Text style={styles.businessTitle}>{business.name}</Text>
          <Text style={styles.businessCategory}>{business.category}</Text>
          <View style={styles.badgeRow}>
            <Badge label={`${business.rating || 4.8} ★ (${business.reviewCount || 150} reviews)`} variant="primary" />
            <Badge label="REGISTERED & VERIFIED" variant="success" />
          </View>
          {business.description ? (
            <Text style={styles.businessDesc}>{business.description}</Text>
          ) : null}
        </Card>

        {/* Branch Selector if multiple branches */}
        {branches.length > 1 ? (
          <View style={styles.branchSelectSection}>
            <Text style={styles.sectionTitle}>Select Branch Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches.map((b) => {
                const isSelected = selectedBranch?._id === b._id;
                return (
                  <TouchableOpacity
                    key={b._id}
                    style={[styles.branchTab, isSelected && styles.branchTabActive]}
                    onPress={() => handleBranchSelect(b)}
                  >
                    <Text style={[styles.branchTabText, isSelected && styles.branchTabTextActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Selected Branch Info & GPS */}
        {selectedBranch ? (
          <Card style={styles.infoCard}>
            <View style={styles.branchHeaderRow}>
              <Text style={styles.branchCardTitle}>{selectedBranch.name}</Text>
              <TouchableOpacity
                style={styles.mapNavBtn}
                onPress={() => openInGoogleMaps(selectedBranch)}
              >
                <Ionicons name="navigate" size={16} color={Palette.primary} />
                <Text style={styles.mapNavText}>Open Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Palette.primary} />
              <Text style={styles.infoText}>{selectedBranch.address}</Text>
            </View>

            {selectedBranch.location?.coordinates ? (
              <View style={styles.gpsRow}>
                <Ionicons name="compass-outline" size={16} color={Palette.secondary} />
                <Text style={styles.gpsText}>
                  GPS: {selectedBranch.location.coordinates[1].toFixed(4)}° N,{' '}
                  {selectedBranch.location.coordinates[0].toFixed(4)}° E
                </Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={Palette.primary} />
              <Text style={styles.infoText}>
                Hours: {selectedBranch.operatingHours?.open || '09:00'} -{' '}
                {selectedBranch.operatingHours?.close || '18:00'}
              </Text>
            </View>

            {selectedBranch.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={Palette.primary} />
                <Text style={styles.infoText}>{selectedBranch.phone}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* Services List */}
        <Text style={styles.sectionTitle}>Available Live Queue Services</Text>

        {services.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No queue services configured for this branch yet.</Text>
          </Card>
        ) : (
          services.map((srv) => {
            const waitingCount = srv.queue?.waitingCount || 0;
            const currentToken = srv.queue?.currentTokenNumber || 'None';

            return (
              <Card key={srv._id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    <Text style={styles.servicePrice}>
                      {srv.price > 0 ? `₹${srv.price}` : 'Free Token Pass'}
                    </Text>
                  </View>
                  <Badge
                    label={`Token Prefix: ${srv.prefix || 'A'}`}
                    variant="primary"
                  />
                </View>

                {srv.description ? (
                  <Text style={styles.serviceDesc}>{srv.description}</Text>
                ) : null}

                <View style={styles.liveQueueBar}>
                  <View style={styles.liveStat}>
                    <Text style={styles.liveStatNum}>{waitingCount}</Text>
                    <Text style={styles.liveStatLabel}>Waiting in Queue</Text>
                  </View>
                  <View style={styles.liveStat}>
                    <Text style={styles.liveStatNum}>{currentToken}</Text>
                    <Text style={styles.liveStatLabel}>Serving Token</Text>
                  </View>
                  <View style={styles.liveStat}>
                    <Text style={styles.liveStatNum}>~{waitingCount * srv.estimatedDurationMinutes}m</Text>
                    <Text style={styles.liveStatLabel}>Est. Wait Time</Text>
                  </View>
                </View>

                <View style={styles.serviceFooter}>
                  <Text style={styles.durationText}>
                    ⏱ {srv.estimatedDurationMinutes} mins / customer consultation
                  </Text>
                  <Button
                    title="Get Token & Join Queue"
                    onPress={() => router.push(`/service/${srv._id}` as any)}
                    style={styles.selectBtn}
                  />
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
  centerContainer: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    color: Palette.mutedText,
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.3)',
  },
  businessTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    textAlign: 'center',
  },
  businessCategory: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  businessDesc: {
    fontSize: 13,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  branchSelectSection: {
    marginTop: Spacing.md,
  },
  branchTab: {
    backgroundColor: Palette.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  branchTabActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  branchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },
  branchTabTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  infoCard: {
    marginVertical: Spacing.md,
    padding: Spacing.lg,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  branchCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    flex: 1,
  },
  mapNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  mapNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Palette.text,
    flex: 1,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 200, 255, 0.08)',
    padding: 6,
    borderRadius: BorderRadius.sm,
    marginVertical: 4,
  },
  gpsText: {
    fontSize: 12,
    color: Palette.secondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    marginVertical: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Palette.mutedText,
    fontSize: 14,
  },
  serviceCard: {
    marginVertical: Spacing.xs,
    padding: Spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.primary,
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  liveQueueBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  liveStat: {
    alignItems: 'center',
  },
  liveStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
  },
  liveStatLabel: {
    fontSize: 11,
    color: Palette.mutedText,
    marginTop: 2,
  },
  serviceFooter: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  durationText: {
    fontSize: 12,
    color: Palette.mutedText,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  selectBtn: {
    height: 44,
  },
});
