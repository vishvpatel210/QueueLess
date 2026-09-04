import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import businessService from '../../services/businessService';
import serviceService from '../../services/serviceService';
import { Business, Branch, ServiceItem } from '../../types/business';

export default function QueueManagementScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Add Service Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('15');
  const [newServicePrice, setNewServicePrice] = useState('0');
  const [newServicePrefix, setNewServicePrefix] = useState('A');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
          const activeBr = branchList[0];
          setSelectedBranch(activeBr);
          setServices(activeBr.services || []);
        }
      }
    } catch (e: any) {
      console.log('Error loading queue management:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setServices((branch as any).services || []);
  };

  const handleOpenAddModal = () => {
    const nextPrefix = String.fromCharCode(65 + (services.length % 26));
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceDuration('15');
    setNewServicePrice('0');
    setNewServicePrefix(nextPrefix);
    setModalVisible(true);
  };

  const handleSaveNewService = async () => {
    if (!selectedBranch) {
      Alert.alert('Error', 'No branch selected.');
      return;
    }

    const cleanName = newServiceName.trim();
    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter a service name.');
      return;
    }

    const duration = parseInt(newServiceDuration, 10) || 15;
    const price = parseFloat(newServicePrice) || 0;
    const prefix = (newServicePrefix || 'A').toUpperCase().trim();

    try {
      setSaving(true);
      const created = await serviceService.createService(selectedBranch._id, {
        name: cleanName,
        description: newServiceDesc.trim(),
        estimatedDurationMinutes: duration,
        price,
        prefix,
      });

      Alert.alert('Service Created', `"${cleanName}" has been added and queue initialized.`);
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = (srv: ServiceItem) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${srv.name}"? Active queues for this service will be closed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceService.deleteService(srv._id);
              Alert.alert('Deleted', 'Service removed successfully.');
              loadData();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to delete service.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading Queue Configuration...</Text>
      </SafeAreaView>
    );
  }

  if (!business || !selectedBranch) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Ionicons name="business-outline" size={48} color={Palette.mutedText} />
        <Text style={styles.emptyTitle}>No Business or Branch Found</Text>
        <Button
          title="Onboard Business"
          onPress={() => router.push('/(auth)/register-admin' as any)}
          style={{ marginTop: Spacing.md }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Queue Settings" subtitle={business.name} showBack />

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
        {/* Branch Selector if multiple */}
        {branches.length > 1 && (
          <View style={styles.branchSelectRow}>
            <Text style={styles.branchSelectLabel}>Branch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  style={[
                    styles.branchPill,
                    selectedBranch._id === b._id && styles.branchPillActive,
                  ]}
                  onPress={() => handleBranchSelect(b)}
                >
                  <Text
                    style={[
                      styles.branchPillText,
                      selectedBranch._id === b._id && styles.branchPillTextActive,
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Branch Setup Card */}
        <Card style={styles.card}>
          <View style={styles.branchCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{selectedBranch.name}</Text>
              <Text style={styles.subtitle}>{selectedBranch.address}</Text>
            </View>
            <Badge label="ACTIVE BRANCH" variant="success" />
          </View>

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
        </Card>

        {/* Manage Services Card */}
        <Card style={styles.card}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>
              Configured Queue Services ({services.length})
            </Text>
          </View>

          {services.length === 0 ? (
            <Text style={styles.emptyServicesText}>
              No services added for this branch yet.
            </Text>
          ) : (
            services.map((srv) => (
              <View key={srv._id} style={styles.serviceItem}>
                <View style={styles.serviceLeft}>
                  <View style={styles.prefixCircle}>
                    <Text style={styles.prefixText}>{srv.prefix || 'A'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    <Text style={styles.serviceDetails}>
                      ⏱ {srv.estimatedDurationMinutes}m consultation • {srv.price > 0 ? `₹${srv.price}` : 'Free pass'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteSrvBtn}
                  onPress={() => handleDeleteService(srv)}
                >
                  <Ionicons name="trash-outline" size={18} color={Palette.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <Button
            title="+ Add New Queue Service"
            variant="outline"
            onPress={handleOpenAddModal}
            style={styles.addBtn}
          />
        </Card>
      </ScrollView>

      {/* Add New Service Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Queue Service</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Palette.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Service Name *"
              placeholder="e.g. General Consultation / Lab Test"
              value={newServiceName}
              onChangeText={setNewServiceName}
            />

            <Input
              label="Description"
              placeholder="Brief details about the service"
              value={newServiceDesc}
              onChangeText={setNewServiceDesc}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Duration (mins) *"
                  placeholder="15"
                  value={newServiceDuration}
                  onChangeText={setNewServiceDuration}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Token Prefix *"
                  placeholder="A"
                  value={newServicePrefix}
                  onChangeText={(val) => setNewServicePrefix(val.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Input
              label="Price (₹)"
              placeholder="0"
              value={newServicePrice}
              onChangeText={setNewServicePrice}
              keyboardType="numeric"
            />

            <View style={styles.modalActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 0.4 }}
              />
              <Button
                title="Save & Launch Service"
                loading={saving}
                onPress={handleSaveNewService}
                style={{ flex: 0.6 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginTop: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  branchSelectRow: {
    marginBottom: Spacing.sm,
  },
  branchSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.mutedText,
    marginBottom: 4,
  },
  branchPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: Spacing.xs,
  },
  branchPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  branchPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.text,
  },
  branchPillTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  branchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: Palette.text,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyServicesText: {
    color: Palette.mutedText,
    fontSize: 13,
    marginVertical: Spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  prefixCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 155, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
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
  deleteSrvBtn: {
    padding: Spacing.xs,
  },
  addBtn: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
