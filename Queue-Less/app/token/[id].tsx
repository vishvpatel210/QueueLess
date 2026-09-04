import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
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
import clipboardService from '../../services/clipboardService';
import queueService from '../../services/queueService';
import { joinQueueRoom, leaveQueueRoom, onQueueUpdate, onTokenCalled } from '../../services/socket';
import { TokenItem } from '../../types/queue';

export default function DigitalTokenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [token, setToken] = useState<TokenItem | null>(null);
  const [peopleAhead, setPeopleAhead] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Review modal
  const [reviewModal, setReviewModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchTokenDetails();
      const interval = setInterval(fetchTokenDetails, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    if (token?.queueId) {
      const qId = typeof token.queueId === 'object' ? (token.queueId as any)._id : token.queueId;
      if (qId) {
        joinQueueRoom(qId);
        const unsubQueue = onQueueUpdate(() => {
          fetchTokenDetails();
        });
        const unsubToken = onTokenCalled((data) => {
          if (data.tokenId === id || data.tokenNumber === token.tokenNumber) {
            Alert.alert(
              '🔔 YOUR TURN!',
              'Your token has been called by the counter. Please proceed immediately!'
            );
            fetchTokenDetails();
          }
        });
        return () => {
          unsubQueue();
          unsubToken();
          leaveQueueRoom(qId);
        };
      }
    }
  }, [token?.queueId, id]);

  const fetchTokenDetails = async () => {
    try {
      const data: any = await queueService.getTokenById(id);
      setToken(data);
      setPeopleAhead(data.peopleAhead ?? 0);
      if (data.hasReview) setHasReviewed(true);
    } catch (err: any) {
      console.log('Error fetching token:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTokenDetails();
  }, [id]);

  const handleCancelToken = () => {
    Alert.alert(
      'Cancel Digital Token',
      'Are you sure you want to cancel your queue token? This action cannot be undone.',
      [
        { text: 'Keep Token', style: 'cancel' },
        {
          text: 'Cancel Token',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await queueService.cancelToken(id);
              setToken(updated);
              Alert.alert('Token Cancelled', 'Your token pass has been cancelled.');
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Failed to cancel token.';
              Alert.alert('Error', msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      await queueService.submitReview(id, rating, comment);
      setHasReviewed(true);
      setReviewModal(false);
      Alert.alert('Thank You!', 'Your review has been submitted successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Fetching digital queue pass...</Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={48} color={Palette.danger} />
        <Text style={styles.errorText}>Digital token pass not found.</Text>
        <Button
          title="Back to Home"
          onPress={() => router.replace('/(tabs)' as any)}
          style={{ marginTop: Spacing.md }}
        />
      </SafeAreaView>
    );
  }

  const queueData = (token as any).queueId;
  const branchData = queueData?.branchId;
  const businessData = branchData?.businessId;
  const serviceData = queueData?.serviceId;

  const branchName = branchData?.name || 'Registered Branch';
  const businessName = businessData?.name || 'Registered Business';
  const serviceName = serviceData?.name || 'Live Service';
  const branchAddress = branchData?.address || '';
  const branchPhone = branchData?.phone || businessData?.phone || '';

  const getStatusBadge = () => {
    switch (token.status) {
      case 'CALLED':
        return <Badge label="🔔 YOUR TURN! PROCEED TO COUNTER" variant="warning" />;
      case 'IN_PROGRESS':
        return <Badge label="SERVICE IN PROGRESS" variant="primary" />;
      case 'COMPLETED':
        return <Badge label="✓ VISIT COMPLETED" variant="success" />;
      case 'CANCELLED':
        return <Badge label="TOKEN CANCELLED" variant="danger" />;
      case 'SKIPPED':
        return <Badge label="TOKEN SKIPPED" variant="danger" />;
      case 'NO_SHOW':
        return <Badge label="NO SHOW" variant="danger" />;
      case 'WAITING':
      default:
        return <Badge label="WAITING IN QUEUE" variant="primary" />;
    }
  };

  const formattedDate = new Date(token.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayToken = (token as any).displayToken || token.tokenNumber;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Digital Pass" showBack />

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
        <Card style={styles.passCard}>
          <Text style={styles.passHeaderTitle}>QueueLess Digital Pass</Text>
          <Text style={styles.passSubtitle}>
            {branchName} • {businessName}
          </Text>

          <View style={styles.statusRow}>{getStatusBadge()}</View>

          {/* Big Token Number with Copy Action */}
          <View style={styles.tokenDisplayContainer}>
            <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
            <Text style={styles.tokenNumber}>{displayToken}</Text>
            <Text style={styles.serviceName}>{serviceName}</Text>

            <TouchableOpacity
              style={styles.copyTokenBtn}
              onPress={() => clipboardService.copyTokenNumber(displayToken)}
              activeOpacity={0.75}
            >
              <Ionicons name="copy-outline" size={16} color={Palette.primary} />
              <Text style={styles.copyTokenText}>Copy Token</Text>
            </TouchableOpacity>
          </View>

          {/* Real Live Stats Bar */}
          {token.status === 'WAITING' ? (
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{peopleAhead}</Text>
                <Text style={styles.statLbl}>People Ahead</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  ~{peopleAhead * (serviceData?.estimatedDurationMinutes || 15)}m
                </Text>
                <Text style={styles.statLbl}>Est. Wait Time</Text>
              </View>
            </View>
          ) : token.status === 'CALLED' ? (
            <View style={styles.calledNotice}>
              <Ionicons name="megaphone" size={24} color="#FF9500" />
              <Text style={styles.calledNoticeText}>
                Counter has called your number. Please proceed to the service desk now!
              </Text>
            </View>
          ) : token.status === 'IN_PROGRESS' ? (
            <View style={styles.inProgressNotice}>
              <Ionicons name="medical" size={24} color={Palette.primary} />
              <Text style={styles.inProgressNoticeText}>Your consultation is currently in progress.</Text>
            </View>
          ) : token.status === 'COMPLETED' ? (
            <View style={styles.completedNotice}>
              <Ionicons name="checkmark-circle" size={24} color={Palette.success} />
              <Text style={styles.completedNoticeText}>Visit Completed. Thank you for using QueueLess!</Text>
            </View>
          ) : null}
        </Card>

        {/* Rate Visit Button when Completed */}
        {token.status === 'COMPLETED' && (
          <Card style={styles.reviewCard}>
            <Text style={styles.detailsTitle}>Rate Your Experience</Text>
            {hasReviewed ? (
              <View style={styles.reviewedRow}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.reviewedText}>You have reviewed this visit. Thank you!</Text>
              </View>
            ) : (
              <Button
                title="★ Rate Your Visit"
                onPress={() => setReviewModal(true)}
                style={{ marginTop: Spacing.xs }}
              />
            )}
          </Card>
        )}

        {/* Booking Information */}
        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Booking Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>For Person:</Text>
            <Text style={styles.infoValue}>{token.forPersonName || 'Myself'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Token Pass ID:</Text>
            <TouchableOpacity
              style={styles.inlineRow}
              onPress={() => clipboardService.copyBookingId(token._id)}
            >
              <Text style={[styles.infoValue, { fontSize: 12 }]}>{token._id}</Text>
              <Ionicons name="copy-outline" size={14} color={Palette.primary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issued Time:</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
        </Card>

        {/* Clipboard Actions */}
        <Card style={styles.actionsCard}>
          <Text style={styles.detailsTitle}>Copy & Share Details</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              clipboardService.copyQueueDetails([
                { label: 'Token Number', value: displayToken },
                { label: 'Token ID', value: token._id },
                { label: 'Service', value: serviceName },
                { label: 'Branch', value: branchName },
                { label: 'Status', value: token.status },
              ])
            }
          >
            <Ionicons name="document-text-outline" size={20} color={Palette.primary} />
            <Text style={styles.actionText}>Copy Queue Pass Details</Text>
            <Ionicons name="chevron-forward" size={16} color={Palette.mutedText} />
          </TouchableOpacity>

          {branchAddress ? (
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomWidth: 0 }]}
              onPress={() =>
                clipboardService.copyBusinessInfo([
                  { label: 'Business', value: businessName },
                  { label: 'Branch', value: branchName },
                  { label: 'Address', value: branchAddress },
                  { label: 'Phone', value: branchPhone },
                ])
              }
            >
              <Ionicons name="business-outline" size={20} color={Palette.primary} />
              <Text style={styles.actionText}>Copy Branch & Contact Info</Text>
              <Ionicons name="chevron-forward" size={16} color={Palette.mutedText} />
            </TouchableOpacity>
          ) : null}
        </Card>

        {/* Cancel Action */}
        {token.status === 'WAITING' && (
          <Button
            title="Cancel Queue Token"
            variant="danger"
            loading={cancelling}
            onPress={handleCancelToken}
            style={styles.cancelBtn}
          />
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Visit</Text>
              <TouchableOpacity onPress={() => setReviewModal(false)}>
                <Ionicons name="close" size={24} color={Palette.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {businessName} • {serviceName}
            </Text>

            <Text style={styles.ratingPrompt}>How was your experience?</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons
                    name={s <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={s <= rating ? '#FFD700' : Palette.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>{rating} out of 5 stars</Text>

            <View style={styles.modalActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setReviewModal(false)}
                style={{ flex: 0.4 }}
              />
              <Button
                title="Submit Review"
                loading={submittingReview}
                onPress={handleSubmitReview}
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
  errorText: {
    color: Palette.danger,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  passCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  passHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 1,
  },
  passSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
  },
  statusRow: {
    marginVertical: Spacing.md,
  },
  tokenDisplayContainer: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.mutedText,
    letterSpacing: 1.5,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: Palette.primary,
    marginVertical: Spacing.xs,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  copyTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(199,243,107,0.12)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  copyTokenText: {
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
  },
  statLbl: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  calledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,149,0,0.12)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  calledNoticeText: {
    color: '#FF9500',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  inProgressNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,229,155,0.12)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  inProgressNoticeText: {
    color: Palette.primary,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,229,155,0.15)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  completedNoticeText: {
    color: Palette.success,
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  reviewCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  reviewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  reviewedText: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsCard: {
    marginTop: Spacing.md,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Palette.mutedText,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  actionsCard: {
    marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: Spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  cancelBtn: {
    marginTop: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Palette.mutedText,
    marginBottom: Spacing.md,
  },
  ratingPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  ratingText: {
    textAlign: 'center',
    color: Palette.mutedText,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
