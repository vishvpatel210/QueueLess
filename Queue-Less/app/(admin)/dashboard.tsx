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
import { joinQueueRoom, leaveQueueRoom, onQueueUpdate } from '../../services/socket';
import { Business, Branch } from '../../types/business';
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
  const [calledToken, setCalledToken] = useState<TokenItem | null>(null);
  const [inProgressToken, setInProgressToken] = useState<TokenItem | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<TokenItem[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [cancelledCount, setCancelledCount] = useState<number>(0);
  const [noShowCount, setNoShowCount] = useState<number>(0);

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const qId = selectedService?.queue?._id || activeQueue?._id;
    if (qId) {
      loadQueueData(qId);
      joinQueueRoom(qId);
      const unsub = onQueueUpdate(() => loadQueueData(qId));
      return () => {
        unsub();
        leaveQueueRoom(qId);
      };
    }
  }, [selectedService, activeQueue?._id]);

  const loadAdminData = async () => {
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
      setCalledToken(data.calledToken || null);
      setInProgressToken(data.inProgressToken || null);
      setWaitingTokens(data.waitingTokens || []);
      setCompletedCount(data.completedCount || 0);
      setSkippedCount(data.skippedCount || 0);
      setCancelledCount(data.cancelledCount || 0);
      setNoShowCount(data.noShowCount || 0);
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
    if ((branch as any).services && (branch as any).services.length > 0) {
      setSelectedService((branch as any).services[0]);
    } else {
      setSelectedService(null);
      setActiveQueue(null);
      setServingToken(null);
      setCalledToken(null);
      setInProgressToken(null);
      setWaitingTokens([]);
    }
  };

  const handleCallNext = async () => {
    if (!activeQueue) return;
    try {
      setActionLoading(true);
      const res = await queueService.callNext(activeQueue._id);
      const tokenNum = res.nextToken?.tokenNumber || res.token?.tokenNumber;
      if (tokenNum) {
        Alert.alert('Called', `Now calling: ${tokenNum}`);
      }
      await loadQueueData(activeQueue._id);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'No more waiting customers.';
      Alert.alert('Notice', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async () => {
    const target = calledToken;
    if (!target) {
      Alert.alert('Notice', 'No called token to start service on. Call next first.');
      return;
    }
    try {
      setActionLoading(true);
      await queueService.startService(target._id);
      Alert.alert('Service Started', `${target.tokenNumber} is now IN PROGRESS.`);
      if (activeQueue) await loadQueueData(activeQueue._id);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to start service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    const target = inProgressToken || calledToken || servingToken;
    if (!target) return;
    try {
      setActionLoading(true);
      await queueService.completeToken(target._id);
      Alert.alert('Completed', `Token ${target.tokenNumber} marked COMPLETED.`);
      if (activeQueue) await loadQueueData(activeQueue._id);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to complete token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    const target = calledToken || servingToken;
    if (!target) return;
    try {
      setActionLoading(true);
      await queueService.skipToken(target._id);
      Alert.alert('Skipped', `Token ${target.tokenNumber} marked as SKIPPED.`);
      if (activeQueue) await loadQueueData(activeQueue._id);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to skip token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    const target = calledToken;
    if (!target) {
      Alert.alert('Notice', 'No-Show only applies to a CALLED token.');
      return;
    }
    Alert.alert('Mark No-Show?', `Mark ${target.tokenNumber} as NO SHOW?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark No-Show',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await queueService.noShowToken(target._id);
            if (activeQueue) await loadQueueData(activeQueue._id);
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to mark no-show.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleToggleQueueState = async () => {
    if (!activeQueue) return;
    try {
      setActionLoading(true);
      if (activeQueue.status === 'OPEN') {
        const updated = await queueService.pauseQueue(activeQueue._id);
        setActiveQueue(updated);
        Alert.alert('Queue Paused', 'New customers cannot join while paused.');
      } else if (activeQueue.status === 'PAUSED') {
        const updated = await queueService.resumeQueue(activeQueue._id);
        setActiveQueue(updated);
        Alert.alert('Queue Resumed', 'Queue is now open.');
      } else {
        Alert.alert('Notice', 'Queue is closed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change queue status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseQueue = async () => {
    if (!activeQueue) return;
    Alert.alert('Close Queue?', 'This will prevent new customers from joining.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Queue',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            const updated = await queueService.closeQueue(activeQueue._id);
            setActiveQueue(updated);
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to close queue.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
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
          You do not have a registered business. Please onboard your business first.
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
  const statusEmoji = queueStatus === 'OPEN' ? '🟢' : queueStatus === 'PAUSED' ? '🟡' : '🔴';
  const currentServingDisplay = inProgressToken || calledToken || servingToken;
  const totalToday =
    waitingTokens.length + completedCount + skippedCount + cancelledCount + noShowCount +
    (calledToken ? 1 : 0) + (inProgressToken ? 1 : 0);

  return (
    <View style={styles.container}>
      <Header
        title="Admin Dashboard"
        subtitle={business.name}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }
      >
        {/* Business & Branch Info */}
        <Card style={styles.headerCard}>
          <Text style={styles.businessName}>{business.name}</Text>
          {selectedBranch && <Text style={styles.branchName}>{selectedBranch.name}</Text>}
          {selectedBranch?.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={13} color={Palette.primary} />
              <Text style={styles.infoText}>{selectedBranch.address}</Text>
            </View>
          ) : null}
          <View style={[styles.infoRow, { marginTop: Spacing.sm }]}>
            <Text style={styles.statusLabel}>Queue Status:</Text>
            <Text style={styles.statusValue}>{statusEmoji} {queueStatus}</Text>
          </View>
        </Card>

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
                  <Text style={[styles.pillText, selectedBranch?._id === b._id && styles.pillTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Service Selector */}
        {selectedBranch && (selectedBranch as any).services?.length > 0 && (
          <View style={styles.selectorSection}>
            <Text style={styles.sectionLabel}>Service Queue:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(selectedBranch as any).services.map((srv: any) => (
                <TouchableOpacity
                  key={srv._id}
                  style={[styles.pillBtn, selectedService?._id === srv._id && styles.pillBtnActive]}
                  onPress={() => setSelectedService(srv)}
                >
                  <Text style={[styles.pillText, selectedService?._id === srv._id && styles.pillTextActive]}>
                    {srv.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalToday}</Text>
            <Text style={styles.statLabel}>Total Tokens</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{waitingTokens.length}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{skippedCount + noShowCount}</Text>
            <Text style={styles.statLabel}>Skipped/NS</Text>
          </View>
        </View>

        {/* NOW SERVING Panel */}
        <Card style={styles.servingCard}>
          <Text style={styles.nowServingLabel}>NOW SERVING</Text>
          <Text style={styles.servingTokenNum}>
            {currentServingDisplay ? currentServingDisplay.tokenNumber : '—'}
          </Text>
          {currentServingDisplay && (
            <>
              <Text style={styles.servingCustomer}>
                Customer: {currentServingDisplay.forPersonName || (currentServingDisplay.userId as any)?.name || 'Guest'}
              </Text>
              <Text style={styles.servingService}>
                {selectedService?.name || 'Service'}
              </Text>
              <Badge
                label={currentServingDisplay.status}
                variant={
                  currentServingDisplay.status === 'IN_PROGRESS' ? 'success' :
                  currentServingDisplay.status === 'CALLED' ? 'warning' : 'primary'
                }
              />
            </>
          )}

          {/* CALL NEXT */}
          <Button
            title="⟶ CALL NEXT CUSTOMER"
            onPress={handleCallNext}
            loading={actionLoading}
            style={styles.callNextBtn}
          />

          {/* START SERVICE — only when CALLED */}
          {calledToken && (
            <Button
              title="▶ START SERVICE"
              variant="secondary"
              onPress={handleStartService}
              loading={actionLoading}
              style={styles.actionBtn}
            />
          )}

          {/* Action Row: MARK COMPLETED | SKIP | NO SHOW */}
          {currentServingDisplay && (
            <View style={styles.actionRow}>
              {(inProgressToken || calledToken) && (
                <Button
                  title="✓ Complete"
                  onPress={handleComplete}
                  loading={actionLoading}
                  style={[styles.actionRowBtn, { backgroundColor: Palette.success }]}
                />
              )}
              <Button
                title="Skip"
                variant="outline"
                onPress={handleSkip}
                loading={actionLoading}
                style={styles.actionRowBtn}
              />
              {calledToken && (
                <Button
                  title="No Show"
                  variant="danger"
                  onPress={handleNoShow}
                  loading={actionLoading}
                  style={styles.actionRowBtn}
                />
              )}
            </View>
          )}
        </Card>

        {/* Queue Controls */}
        <Card style={styles.controlsCard}>
          <Text style={styles.sectionTitle}>Queue Controls</Text>
          <View style={styles.controlRow}>
            {queueStatus !== 'CLOSED' && (
              <Button
                title={queueStatus === 'OPEN' ? '⏸ Pause Queue' : '▶ Resume Queue'}
                variant={queueStatus === 'OPEN' ? 'secondary' : 'primary'}
                onPress={handleToggleQueueState}
                loading={actionLoading}
                style={styles.controlBtn}
              />
            )}
            {queueStatus !== 'CLOSED' && (
              <Button
                title="✕ Close Queue"
                variant="danger"
                onPress={handleCloseQueue}
                loading={actionLoading}
                style={styles.controlBtn}
              />
            )}
            {queueStatus === 'CLOSED' && (
              <Text style={styles.closedText}>Queue is CLOSED for today.</Text>
            )}
          </View>
        </Card>

        {/* Waiting Queue List */}
        <Text style={styles.sectionTitle}>
          Waiting in Line ({waitingTokens.length})
        </Text>

        {waitingTokens.length === 0 ? (
          <Card style={styles.emptyListCard}>
            <Ionicons name="checkmark-circle-outline" size={28} color={Palette.success} />
            <Text style={styles.emptyListText}>No customers currently waiting.</Text>
          </Card>
        ) : (
          waitingTokens.map((item, idx) => (
            <Card key={item._id} style={styles.customerRowCard}>
              <View style={styles.customerRowLeft}>
                <Text style={styles.queuePosition}>{idx + 1}</Text>
                <View style={styles.tokenTag}>
                  <Text style={styles.tokenTagText}>{item.tokenNumber}</Text>
                </View>
                <View>
                  <Text style={styles.customerName}>
                    {item.forPersonName || (item.userId as any)?.name || 'Customer'}
                  </Text>
                  <Text style={styles.customerPhone}>
                    {item.forPersonPhone || (item.userId as any)?.email || ''}
                  </Text>
                </View>
              </View>
              <Badge label={`#${item.sequenceNumber}`} variant="primary" />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  centerContainer: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: { color: Palette.mutedText, marginTop: Spacing.sm, fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Palette.text, marginTop: Spacing.md, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: Palette.mutedText, textAlign: 'center', marginTop: Spacing.xs },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  headerCard: { marginBottom: Spacing.md, padding: Spacing.md },
  businessName: { fontSize: 20, fontWeight: '800', color: Palette.text },
  branchName: { fontSize: 14, color: Palette.mutedText, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  infoText: { fontSize: 12, color: Palette.mutedText },
  statusLabel: { fontSize: 13, color: Palette.mutedText, fontWeight: '600' },
  statusValue: { fontSize: 14, fontWeight: '700', color: Palette.text, marginLeft: 6 },
  selectorSection: { marginBottom: Spacing.sm },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Palette.mutedText, marginBottom: 4 },
  pillBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: Spacing.xs,
  },
  pillBtnActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: Palette.text },
  pillTextActive: { color: '#0B0D0E', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Palette.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Palette.text },
  statLabel: { fontSize: 10, color: Palette.mutedText, marginTop: 2, textAlign: 'center' },
  servingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Palette.primary,
    marginBottom: Spacing.md,
  },
  nowServingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  servingTokenNum: { fontSize: 56, fontWeight: '900', color: Palette.primary },
  servingCustomer: { fontSize: 15, fontWeight: '700', color: Palette.text, marginTop: Spacing.xs },
  servingService: { fontSize: 13, color: Palette.mutedText, marginBottom: Spacing.xs },
  callNextBtn: { width: '100%', marginTop: Spacing.md, height: 52 },
  actionBtn: { width: '100%', marginTop: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginTop: Spacing.sm },
  actionRowBtn: { flex: 1, height: 44 },
  controlsCard: { marginBottom: Spacing.md, padding: Spacing.md },
  controlRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  controlBtn: { flex: 1 },
  closedText: { color: Palette.danger, fontSize: 14, fontWeight: '700', textAlign: 'center', flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Palette.text, marginBottom: Spacing.sm },
  emptyListCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  emptyListText: { fontSize: 13, color: Palette.mutedText },
  customerRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    padding: Spacing.md,
  },
  customerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  queuePosition: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.mutedText,
    width: 20,
    textAlign: 'center',
  },
  tokenTag: {
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tokenTagText: { fontSize: 14, fontWeight: '800', color: Palette.primary },
  customerName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  customerPhone: { fontSize: 11, color: Palette.mutedText },
});
