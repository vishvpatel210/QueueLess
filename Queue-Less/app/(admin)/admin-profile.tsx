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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import businessService from '../../services/businessService';
import { Business, Branch, ServiceItem } from '../../types/business';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const res = await businessService.getMyBusinessAdmin();
      if (res.businesses && res.businesses.length > 0) {
        const myBiz = res.businesses[0];
        setBusiness(myBiz);

        const fullBiz: any = await businessService.getBusinessById(myBiz._id);
        const branchList = fullBiz.branches || [];
        setBranches(branchList);

        if (branchList.length > 0) {
          const firstBranch = branchList[0];
          setSelectedBranch(firstBranch);
          setServices((firstBranch as any).services || []);
        }
      }
    } catch (e) {
      console.log('Error loading admin profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBusinessData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Admin portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading Admin Profile...</Text>
      </View>
    );
  }

  const qrData = selectedBranch ? `queueless://branch/${selectedBranch._id}` : 'queueless://';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrData
  )}&bgcolor=15181b&color=00E59B`;

  return (
    <View style={styles.container}>
      <Header title="Business & Admin" subtitle="Management & QR Code" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.primary}
          />
        }
      >
        {/* Business Profile */}
        {business && (
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{business.name}</Text>
                <Text style={styles.bizCategory}>{business.category}</Text>
              </View>
              <Badge label={business.status || 'ACTIVE'} variant="primary" />
            </View>

            {business.description ? (
              <Text style={styles.bizDesc}>{business.description}</Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={Palette.primary} />
              <Text style={styles.infoText}>{business.email}</Text>
            </View>

            {business.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color={Palette.primary} />
                <Text style={styles.infoText}>{business.phone}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {/* Branch Details */}
        {selectedBranch && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Branch Location & Hours</Text>
            <Text style={styles.branchName}>{selectedBranch.name}</Text>
            <Text style={styles.branchAddress}>{selectedBranch.address}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={Palette.primary} />
              <Text style={styles.infoText}>
                Operating Hours: {selectedBranch.operatingHours?.open || '09:00'} -{' '}
                {selectedBranch.operatingHours?.close || '18:00'}
              </Text>
            </View>

            {selectedBranch.location?.coordinates && (
              <View style={styles.infoRow}>
                <Ionicons name="navigate-outline" size={16} color={Palette.primary} />
                <Text style={styles.infoText}>
                  GPS: {selectedBranch.location.coordinates[1].toFixed(4)}°N,{' '}
                  {selectedBranch.location.coordinates[0].toFixed(4)}°E
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Dynamic Branch QR Code */}
        {selectedBranch && (
          <Card style={styles.qrCard}>
            <Text style={styles.sectionTitle}>Branch Walk-In QR Code</Text>
            <Text style={styles.qrSubtitle}>
              Display or print this QR at your entrance for instant walk-in token check-in.
            </Text>

            <View style={styles.qrContainer}>
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
            </View>

            <Text style={styles.qrScanCodeText}>Branch ID: {selectedBranch._id}</Text>
          </Card>
        )}

        {/* Services Overview */}
        <Card style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Active Services ({services.length})</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/queue-management')}>
              <Text style={styles.manageLink}>Manage →</Text>
            </TouchableOpacity>
          </View>

          {services.length === 0 ? (
            <Text style={styles.emptyText}>No services configured yet.</Text>
          ) : (
            services.map((srv) => (
              <View key={srv._id} style={styles.srvRow}>
                <View style={styles.srvPrefix}>
                  <Text style={styles.srvPrefixText}>{srv.prefix || 'A'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.srvName}>{srv.name}</Text>
                  <Text style={styles.srvDetails}>
                    ⏱ {srv.estimatedDurationMinutes}m • {srv.price > 0 ? `₹${srv.price}` : 'Free'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Account Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Admin Account</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={Palette.primary} />
            <Text style={styles.infoText}>{user?.name || 'Administrator'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={Palette.primary} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Palette.primary} />
            <Text style={styles.infoText}>Role: SHOP_ADMIN (Business Owner)</Text>
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Sign Out of Admin"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  center: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: Palette.mutedText, marginTop: Spacing.sm, fontSize: 13 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  card: { marginBottom: Spacing.md, padding: Spacing.md },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bizName: { fontSize: 20, fontWeight: '800', color: Palette.text },
  bizCategory: { fontSize: 13, color: Palette.primary, fontWeight: '600', marginTop: 2 },
  bizDesc: { fontSize: 13, color: Palette.mutedText, marginTop: Spacing.xs, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: Spacing.sm },
  branchName: { fontSize: 16, fontWeight: '700', color: Palette.text },
  branchAddress: { fontSize: 13, color: Palette.mutedText, marginTop: 2, marginBottom: Spacing.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  infoText: { fontSize: 13, color: Palette.text },
  qrCard: { marginBottom: Spacing.md, padding: Spacing.lg, alignItems: 'center' },
  qrSubtitle: {
    fontSize: 12,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  qrContainer: {
    padding: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: { width: 180, height: 180, borderRadius: BorderRadius.md },
  qrScanCodeText: {
    fontSize: 11,
    color: Palette.mutedText,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  manageLink: { fontSize: 13, color: Palette.primary, fontWeight: '700' },
  emptyText: { color: Palette.mutedText, fontSize: 13, marginVertical: Spacing.xs },
  srvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  srvPrefix: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 155, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  srvPrefixText: { fontSize: 14, fontWeight: '800', color: Palette.primary },
  srvName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  srvDetails: { fontSize: 11, color: Palette.mutedText, marginTop: 1 },
  logoutBtn: { marginBottom: Spacing.xl },
});
