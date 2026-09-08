import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';

interface HistoryToken {
  _id: string;
  tokenNumber: string;
  displayToken: string;
  status: string;
  joinedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  skippedAt?: string;
  noShowAt?: string;
  hasReview?: boolean;
  queueId?: any;
}

const STATUS_ICONS: Record<string, string> = {
  COMPLETED: 'checkmark-circle',
  CANCELLED: 'close-circle',
  SKIPPED: 'arrow-forward-circle',
  NO_SHOW: 'alert-circle',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: Palette.success,
  CANCELLED: Palette.danger,
  SKIPPED: Palette.mutedText,
  NO_SHOW: '#FF9500',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
};

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tokens, setTokens] = useState<HistoryToken[]>([]);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewToken, setReviewToken] = useState<HistoryToken | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get<any>('/tokens/history');
      setTokens(res.data?.data || []);
    } catch (e) {
      setTokens([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  const openReviewModal = (token: HistoryToken) => {
    if (token.hasReview) {
      Alert.alert('Already Reviewed', 'You have already submitted a review for this visit.');
      return;
    }
    setReviewToken(token);
    setRating(5);
    setComment('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewToken) return;
    try {
      setSubmittingReview(true);
      await api.post(`/tokens/${reviewToken._id}/review`, { rating, comment });
      setReviewModal(false);
      Alert.alert('Thank You!', 'Your review has been submitted successfully.');
      // Update local state
      setTokens((prev) =>
        prev.map((t) => (t._id === reviewToken._id ? { ...t, hasReview: true } : t))
      );
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading visit history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="History" subtitle="Your past queue visits" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }
      >
        {tokens.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="time-outline" size={36} color={Palette.mutedText} />
            </View>
            <Text style={styles.emptyTitle}>No Past Tokens</Text>
            <Text style={styles.emptySubtitle}>
              Your completed, cancelled, and skipped queue visits will appear here.
            </Text>
          </Card>
        ) : (
          tokens.map((item) => {
            const displayToken = item.displayToken || item.tokenNumber;
            const status = item.status;
            const statusColor = STATUS_COLORS[status] || Palette.mutedText;
            const statusIcon = STATUS_ICONS[status] || 'help-circle';
            const businessName = item.queueId?.branchId?.businessId?.name || 'Business';
            const branchName = item.queueId?.branchId?.name || '';
            const serviceName = item.queueId?.serviceId?.name || 'Service';

            const endDate =
              item.completedAt || item.cancelledAt || item.skippedAt || item.noShowAt || item.joinedAt;

            return (
              <Card key={item._id} style={styles.historyCard}>
                <View style={styles.cardTop}>
                  <View style={styles.tokenInfo}>
                    <Text style={[styles.tokenNumber, { color: statusColor }]}>{displayToken}</Text>
                    <Text style={styles.businessName}>{businessName}</Text>
                    {branchName ? <Text style={styles.branchName}>{branchName}</Text> : null}
                    <Text style={styles.serviceName}>{serviceName}</Text>
                  </View>

                  <View style={styles.statusColumn}>
                    <Ionicons name={statusIcon as any} size={28} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>

                  {status === 'COMPLETED' && !item.hasReview && (
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => openReviewModal(item)}
                    >
                      <Ionicons name="star-outline" size={16} color={Palette.primary} />
                      <Text style={styles.reviewBtnText}>Rate Visit</Text>
                    </TouchableOpacity>
                  )}

                  {status === 'COMPLETED' && item.hasReview && (
                    <View style={styles.reviewedTag}>
                      <Ionicons name="star" size={14} color={Palette.primary} />
                      <Text style={styles.reviewedText}>Reviewed</Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
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

            {reviewToken && (
              <Text style={styles.modalSubtitle}>
                {reviewToken.displayToken || reviewToken.tokenNumber} ·{' '}
                {reviewToken.queueId?.serviceId?.name || 'Service'}
              </Text>
            )}

            <Text style={styles.ratingLabel}>How was your experience?</Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={star <= rating ? '#FFD700' : Palette.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingValue}>{rating} / 5</Text>

            {/* Comment Input */}
            <View style={styles.commentBox}>
              <Text style={styles.commentLabel}>Comment (optional)</Text>
              <View style={styles.commentInput}>
                <Text
                  style={styles.commentPlaceholder}
                  onPress={() => {}}
                >
                  {comment || 'Share your experience...'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setReviewModal(false)}
                style={{ flex: 0.4 }}
              />
              <Button
                title="Submit Review"
                onPress={handleSubmitReview}
                loading={submittingReview}
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
  container: { flex: 1, backgroundColor: Palette.background },
  center: {
    flex: 1,
    backgroundColor: Palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: Palette.mutedText, marginTop: Spacing.sm, fontSize: 13 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  emptyCard: { alignItems: 'center', padding: Spacing.xl },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Palette.text, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 14, color: Palette.mutedText, textAlign: 'center', lineHeight: 20 },
  historyCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tokenInfo: { flex: 1 },
  tokenNumber: { fontSize: 24, fontWeight: '900' },
  businessName: { fontSize: 15, fontWeight: '700', color: Palette.text, marginTop: 4 },
  branchName: { fontSize: 12, color: Palette.mutedText, marginTop: 1 },
  serviceName: { fontSize: 13, color: Palette.mutedText, marginTop: 1 },
  statusColumn: { alignItems: 'center', marginLeft: Spacing.md },
  statusText: { fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  dateText: { fontSize: 12, color: Palette.mutedText },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewBtnText: { fontSize: 13, color: Palette.primary, fontWeight: '700' },
  reviewedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewedText: { fontSize: 12, color: Palette.primary, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: Palette.text },
  modalSubtitle: { fontSize: 13, color: Palette.mutedText, marginBottom: Spacing.md },
  ratingLabel: { fontSize: 15, fontWeight: '600', color: Palette.text, marginBottom: Spacing.sm },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ratingValue: { textAlign: 'center', color: Palette.mutedText, fontSize: 13, marginBottom: Spacing.md },
  commentBox: { marginBottom: Spacing.lg },
  commentLabel: { fontSize: 13, color: Palette.mutedText, marginBottom: Spacing.xs },
  commentInput: {
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 80,
  },
  commentPlaceholder: { color: Palette.mutedText, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
});
