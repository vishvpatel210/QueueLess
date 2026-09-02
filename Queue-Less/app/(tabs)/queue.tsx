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
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

interface TokenData {
  _id: string;
  tokenNumber: string;
  displayToken: string;
  status: string;
  sequenceNumber: number;
  peopleAhead: number;
  estimatedWaitTimeMinutes: number;
  joinedAt: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  forPersonName?: string;
  queueId?: any;
}

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'WAITING IN LINE',
  CALLED: '🔔 YOUR TURN',
  IN_PROGRESS: 'SERVICE IN PROGRESS',
  COMPLETED: '✓ VISIT COMPLETED',
  CANCELLED: 'CANCELLED',
  SKIPPED: 'SKIPPED',
  NO_SHOW: 'NO SHOW',
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: Palette.primary,
  CALLED: '#FF9500',
  IN_PROGRESS: '#00C851',
  COMPLETED: Palette.success,
  CANCELLED: Palette.danger,
  SKIPPED: Palette.mutedText,
  NO_SHOW: Palette.danger,
};

export default function QueueTabScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [token, setToken] = useState<TokenData | null>(null);

  const fetchActiveToken = useCallback(async () => {
    try {
      const res = await api.get<any>('/tokens/active');
      const tokens = res.data?.data || [];
      setToken(tokens.length > 0 ? tokens[0] : null);
    } catch (e) {
      setToken(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveToken();
  }, []);

  // Socket.IO: listen for real-time token updates
  useEffect(() => {
    if (!socket || !token) return;

    // Join user's personal notification channel
    socket.emit('join:user', user?._id || (user as any)?.id);

    const onTokenCalled = (payload: any) => {
      if (payload.tokenId === token._id) {
        setToken((prev) => prev ? { ...prev, status: 'CALLED' } : prev);
      }
    };

    const onTokenUpdated = (payload: any) => {
      if (payload.tokenId === token._id) {
        setToken((prev) => prev ? { ...prev, status: payload.status } : prev);
      }
    };

    socket.on('token:called', onTokenCalled);
    socket.on('token:updated', onTokenUpdated);

    return () => {
      socket.off('token:called', onTokenCalled);
      socket.off('token:updated', onTokenUpdated);
    };
  }, [socket, token?._id, user]);

  const handleCancelToken = async () => {
    if (!token) return;
    Alert.alert(
      'Cancel Queue',
      'Are you sure you want to leave this queue? Your spot will be lost.',
      [
        { text: 'Keep My Spot', style: 'cancel' },
        {
          text: 'Cancel Queue',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await api.post(`/tokens/${token._id}/cancel`);
              setToken(null);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to cancel token.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActiveToken();
  }, [fetchActiveToken]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Fetching your live token...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Header title="My Queue" subtitle="Your live digital pass" />
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
          }
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="ticket-outline" size={44} color={Palette.mutedText} />
            </View>
            <Text style={styles.emptyTitle}>No Active Queue Token</Text>
            <Text style={styles.emptySubtitle}>
              You are not currently in any queue. Explore nearby registered businesses to join a queue.
            </Text>
            <Button
              title="Explore Businesses"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.exploreBtn}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const status = token.status;
  const statusColor = STATUS_COLORS[status] || Palette.primary;
  const statusLabel = STATUS_LABELS[status] || status;
  const displayToken = token.displayToken || token.tokenNumber;
  const branchName = token.queueId?.branchId?.name || 'Branch';
  const businessName = token.queueId?.branchId?.businessId?.name || 'Business';
  const serviceName = token.queueId?.serviceId?.name || 'Service';
  const canCancel = ['WAITING', 'CALLED'].includes(status);
  const isCompleted = status === 'COMPLETED';

  return (
    <View style={styles.container}>
      <Header title="My Queue" subtitle="Live real-time tracker" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }
      >
        {/* CALLED Alert Banner */}
        {status === 'CALLED' && (
          <View style={styles.calledBanner}>
            <Ionicons name="notifications" size={22} color="#0B0D0E" />
            <Text style={styles.calledBannerText}>YOUR TURN — Please proceed to the counter!</Text>
          </View>
        )}

        {/* Token Pass Card */}
        <Card style={[styles.tokenCard, { borderColor: statusColor }]}>
          <View style={styles.tokenHeader}>
            <Badge
              label={statusLabel}
              variant={status === 'CALLED' ? 'warning' : status === 'COMPLETED' ? 'success' : 'primary'}
            />
            {['WAITING', 'CALLED', 'IN_PROGRESS'].includes(status) && (
              <Text style={styles.liveIndicator}>● Live</Text>
            )}
          </View>

          <Text style={[styles.tokenNumber, { color: statusColor }]}>{displayToken}</Text>

          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.branchName}>{branchName}</Text>
          <Text style={styles.serviceName}>{serviceName}</Text>

          {status === 'WAITING' && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{token.peopleAhead ?? 0}</Text>
                <Text style={styles.statLabel}>People Ahead</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  ~{token.estimatedWaitTimeMinutes > 0 ? token.estimatedWaitTimeMinutes : '?'}m
                </Text>
                <Text style={styles.statLabel}>Est. Wait</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>#{(token.peopleAhead ?? 0) + 1}</Text>
                <Text style={styles.statLabel}>Position</Text>
              </View>
            </View>
          )}

          {status === 'CALLED' && (
            <View style={styles.calledInfoBox}>
              <Ionicons name="arrow-forward-circle" size={28} color="#FF9500" />
              <Text style={styles.calledInfoText}>Please proceed to the service counter immediately.</Text>
            </View>
          )}

          {status === 'IN_PROGRESS' && (
            <View style={styles.inProgressBox}>
              <Ionicons name="medical" size={22} color={Palette.primary} />
              <Text style={styles.inProgressText}>Service is currently in progress.</Text>
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedBox}>
              <Ionicons name="checkmark-circle" size={28} color={Palette.success} />
              <Text style={styles.completedText}>Your visit is complete. Thank you!</Text>
            </View>
          )}

          {/* Actions */}
          {isCompleted && (
            <Button
              title="Rate Your Visit ★"
              onPress={() => router.push(`/token/${token._id}` as any)}
              style={styles.actionBtn}
            />
          )}

          {!isCompleted && (
            <Button
              title="View Full Digital Pass"
              variant="outline"
              onPress={() => router.push(`/token/${token._id}` as any)}
              style={styles.actionBtn}
            />
          )}

          {canCancel && (
            <Button
              title="Cancel Queue"
              variant="danger"
              onPress={handleCancelToken}
              loading={cancelling}
              style={styles.cancelBtn}
            />
          )}
        </Card>

        {/* Join Time */}
        <Text style={styles.joinedAt}>
          Joined: {new Date(token.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
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
  emptyScroll: { flex: 1, justifyContent: 'center', padding: Spacing.md },
  emptyState: { alignItems: 'center', padding: Spacing.xl },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Palette.text, marginBottom: Spacing.xs },
  emptySubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  exploreBtn: { width: '100%' },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  calledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  calledBannerText: { color: '#0B0D0E', fontWeight: '800', fontSize: 14, flex: 1 },
  tokenCard: {
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  liveIndicator: { fontSize: 12, color: Palette.success, fontWeight: '700' },
  tokenNumber: { fontSize: 52, fontWeight: '900', marginVertical: Spacing.xs },
  businessName: { fontSize: 18, fontWeight: '700', color: Palette.text },
  branchName: { fontSize: 13, color: Palette.mutedText, marginTop: 2 },
  serviceName: { fontSize: 14, color: Palette.mutedText, marginTop: 2, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Palette.text },
  statLabel: { fontSize: 11, color: Palette.mutedText, marginTop: 2, textAlign: 'center' },
  calledInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  calledInfoText: { color: '#FF9500', fontWeight: '700', fontSize: 14, flex: 1 },
  inProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 229, 155, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  inProgressText: { color: Palette.primary, fontWeight: '600', fontSize: 14, flex: 1 },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 229, 155, 0.12)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  completedText: { color: Palette.success, fontWeight: '600', fontSize: 14, flex: 1 },
  actionBtn: { marginTop: Spacing.md },
  cancelBtn: { marginTop: Spacing.sm },
  joinedAt: { fontSize: 12, color: Palette.mutedText, textAlign: 'center', marginTop: Spacing.xs },
});
