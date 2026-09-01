import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import businessService from '../../services/businessService';
import queueService from '../../services/queueService';
import { Business, Branch, ServiceItem } from '../../types/business';
import { TokenItem, QueueItem } from '../../types/queue';

export default function AdminDashboardScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const [activeQueue, setActiveQueue] = useState<QueueItem | null>(null);
  const [servingToken, setServingToken] = useState<TokenItem | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<TokenItem[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (selectedService?.queue?._id || activeQueue?._id) {
      const qId = selectedService?.queue?._id || activeQueue?._id;
      loadQueueData(qId);
    }
  }, [selectedService]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await businessService.getMyBusinessAdmin();
      if (res.businesses && res.businesses.length > 0) {
        const myBiz = res.businesses[0];
        setBusiness(myBiz);

        // Fetch deep business info with branches, services, and live queues
        const fullBiz: any = await businessService.getBusinessById(myBiz._id);
        const branchList = fullBiz.branches || [];
        setBranches(branchList);

        if (branchList.length > 0) {
          const firstBranch = branchList[0];
          setSelectedBranch(firstBranch);
          if (firstBranch.services && firstBranch.services.length > 0) {
            const firstSrv = firstBranch.services[0];
            setSelectedService(firstSrv);
            if (firstSrv.queue) {
              setActiveQueue(firstSrv.queue);
              await loadQueueData(firstSrv.queue._id);
            }
          }
        }
      }
    } catch (e: any) {
      console.log('Error loading admin dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadQueueData = async (queueId: string) => {
    try {
      const data = await queueService.getQueueTokens(queueId);
      setActiveQueue(data.queue);
      setServingToken(data.servingToken);
      setWaitingTokens(data.waitingTokens || []);
      setCompletedCount(data.completedCount || 0);
    } catch (e: any) {
      console.log('Error loading queue data:', e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdminData();
  }, []);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    if (branch.services && branch.services.length > 0) {
      setSelectedService(branch.services[0]);
    } else {
      setSelectedService(null);
      setActiveQueue(null);
      setServingToken(null);
      setWaitingTokens([]);
    }
  };

  const handleCallNext = async () => {
    if (!activeQueue) return;
    try {
      setActionLoading(true);
      const res = await queueService.callNext(activeQueue._id);
      Alert.alert('Next Called', `Now calling token: ${res.token?.tokenNumber || 'Next'}`);
      await loadQueueData(activeQueue._id);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'No more waiting customers.';
      Alert.alert('Notice', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!servingToken) return;
    try {
      setActionLoading(true);
      await queueService.skipToken(servingToken._id);
      Alert.alert('Token Skipped', `Token ${servingToken.tokenNumber} marked as SKIPPED.`);
      if (activeQueue) await loadQueueData(activeQueue._id);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to skip token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!servingToken) return;
    try {
      setActionLoading(true);
      await queueService.completeToken(servingToken._id);
      Alert.alert('Completed', `Token ${servingToken.tokenNumber} marked as COMPLETED.`);
      if (activeQueue) await loadQueueData(activeQueue._id);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to complete token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleQueueState = async () => {
    if (!activeQueue) return;
    try {
      setActionLoading(true);
      if (activeQueue.status === 'OPEN') {
        const updated = await queueService.pauseQueue(activeQueue._id);
        setActiveQueue(updated);
        Alert.alert('Queue Paused', 'Customer token check-ins are temporarily paused.');
      } else {
        const updated = await queueService.resumeQueue(activeQueue._id);
        setActiveQueue(updated);
        Alert.alert('Queue Resumed', 'Queue is now open for customer check-ins.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change queue status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading Admin Control Center...</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="business-outline" size={48} color={Palette.mutedText} />
        <Text style={styles.emptyTitle}>No Business Found</Text>
        <Text style={styles.emptySubtitle}>
          You do not have a registered business associated with this admin account yet.
        </Text>
        <Button
          title="Onboard Your Business Now"
          onPress={() => router.push('/(auth)/register-admin' as any)}
          style={{ marginTop: Spacing.md }}
        />
      </View>
    );
  }

  const queueStatus = activeQueue?.status || 'OPEN';

  return (
    <View style={styles.container}>
      <Header
        title="Admin Control Center"
        subtitle={business.name}
        showBack
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(admin)/queue-management')}>
            <Ionicons name="settings-outline" size={24} color={Palette.text} />
          </TouchableOpacity>
        }
      />

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
        {/* Branch Selector */}
        {branches.length > 1 && (
          <View style={styles.selectorSection}>
            <Text style={styles.sectionLabel}>Active Branch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  style={[styles.pillBtn, selectedBranch?._id === b._id && styles.pillBtnActive]}
                  onPress={() => handleBranchSelect(b)}
                >
                  <Text
                    style={[styles.pillText, selectedBranch?._id === b._id && styles.pillTextActive]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Service Selector */}
        {selectedBranch && selectedBranch.services && selectedBranch.services.length > 0 && (
          <View style={styles.selectorSection}>
            <Text style={styles.sectionLabel}>Queue Service:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedBranch.services.map((srv: any) => (
                <TouchableOpacity
                  key={srv._id}
                  style={[
                    styles.pillBtn,
                    selectedService?._id === srv._id && styles.pillBtnActive,
                  ]}
                  onPress={() => setSelectedService(srv)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedService?._id === srv._id && styles.pillTextActive,
                    ]}
                  >
                    {srv.name} (Prefix: {srv.prefix})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Queue Status Controller Bar */}
        <Card style={styles.statusControlCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Queue Status:</Text>
            <Badge
              label={queueStatus}
              variant={
                queueStatus === 'OPEN'
                  ? 'success'
                  : queueStatus === 'PAUSED'
                  ? 'warning'
                  : 'danger'
              }
            />
          </View>
          <Button
            title={queueStatus === 'OPEN' ? 'Pause Queue' : 'Resume Queue'}
            variant={queueStatus === 'OPEN' ? 'secondary' : 'primary'}
            onPress={handleToggleQueueState}
            loading={actionLoading}
            style={styles.statusBtn}
          />
        </Card>

        {/* Currently Serving Token Banner */}
        <Card style={styles.currentTokenCard}>
          <Text style={styles.cardHeaderTitle}>CURRENTLY SERVING TOKEN</Text>
          <Text style={styles.currentTokenDisplay}>
            {servingToken ? servingToken.tokenNumber : 'None'}
          </Text>
          <Text style={styles.currentTokenInfo}>
            {selectedService ? selectedService.name : 'Queue Service'} •{' '}
            {selectedBranch ? selectedBranch.name : 'Branch'}
          </Text>

          {servingToken ? (
            <View style={styles.servingCustomerDetails}>
              <Text style={styles.servingCustomerName}>
                Customer: {servingToken.forPersonName || (servingToken.userId as any)?.name || 'Guest'}
              </Text>
              {servingToken.forPersonPhone ? (
                <Text style={styles.servingCustomerPhone}>Phone: {servingToken.forPersonPhone}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Primary Action Button */}
          <Button
            title="CALL NEXT CUSTOMER ➔"
            onPress={handleCallNext}
            loading={actionLoading}
            style={styles.callNextBtn}
          />

          {servingToken && (
            <View style={styles.subActionsRow}>
              <Button
                title="Skip Token"
                variant="outline"
                onPress={handleSkip}
                loading={actionLoading}
                style={styles.subActionBtn}
              />
              <Button
                title="Mark Completed"
                variant="secondary"
                onPress={handleComplete}
                loading={actionLoading}
                style={styles.subActionBtn}
              />
            </View>
          )}
        </Card>

        {/* Real Metrics Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{waitingTokens.length}</Text>
            <Text style={styles.statLabel}>Waiting in Line</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ~{waitingTokens.length * (selectedService?.estimatedDurationMinutes || 15)}m
            </Text>
            <Text style={styles.statLabel}>Est. Total Wait</Text>
          </View>
        </View>

        {/* Waiting Customers Queue List */}
        <Text style={styles.sectionTitle}>
          Waiting Customers in Line ({waitingTokens.length})
        </Text>

        {waitingTokens.length === 0 ? (
          <Card style={styles.emptyListCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={Palette.success} />
            <Text style={styles.emptyListText}>No customers currently waiting in this queue.</Text>
          </Card>
        ) : (
          waitingTokens.map((item) => (
            <Card key={item._id} style={styles.customerRowCard}>
              <View style={styles.customerRowLeft}>
                <View style={styles.tokenTag}>
                  <Text style={styles.tokenTagText}>{item.tokenNumber}</Text>
                </View>
                <View>
                  <Text style={styles.customerName}>
                    {item.forPersonName || (item.userId as any)?.name || 'Customer'}
                  </Text>
                  <Text style={styles.forPerson}>
                    {item.forPersonPhone || (item.userId as any)?.email || 'App Booking'}
                  </Text>
                </View>
              </View>
              <Badge
                label={`Seq #${item.sequenceNumber}`}
                variant="primary"
              />
            </Card>
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
  emptySubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  selectorSection: {
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.mutedText,
    marginBottom: 4,
  },
  pillBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: Spacing.xs,
  },
  pillBtnActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.text,
  },
  pillTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  statusControlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: Palette.mutedText,
  },
  statusBtn: {
    height: 38,
    paddingHorizontal: Spacing.md,
  },
  currentTokenCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.primary,
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 1,
  },
  currentTokenDisplay: {
    fontSize: 52,
    fontWeight: '900',
    color: Palette.primary,
    marginVertical: Spacing.xs,
  },
  currentTokenInfo: {
    fontSize: 14,
    color: Palette.mutedText,
  },
  servingCustomerDetails: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 229, 155, 0.08)',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    width: '100%',
  },
  servingCustomerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  servingCustomerPhone: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  callNextBtn: {
    width: '100%',
    marginTop: Spacing.md,
    height: 52,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  subActionBtn: {
    flex: 1,
    height: 42,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  statLabel: {
    fontSize: 11,
    color: Palette.mutedText,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  emptyListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Palette.surface,
  },
  emptyListText: {
    fontSize: 13,
    color: Palette.mutedText,
  },
  customerRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  customerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tokenTag: {
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tokenTagText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.primary,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  forPerson: {
    fontSize: 12,
    color: Palette.mutedText,
  },
});
