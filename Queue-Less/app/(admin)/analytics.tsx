import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import businessService from '../../services/businessService';
import api from '../../services/api';

interface AnalyticsData {
  summary: {
    total: number;
    waiting: number;
    completed: number;
    cancelled: number;
    skipped: number;
    noShow: number;
    avgWaitTime: number;
    avgServiceTime: number;
    completionRate: number;
  };
  peakHour: string;
  serviceBreakdown: Array<{ name: string; count: number; completed: number }>;
}

export default function AdminAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [days, setDays] = useState(1);

  useEffect(() => {
    loadBranchAndAnalytics();
  }, []);

  useEffect(() => {
    if (branchId) fetchAnalytics(branchId, days);
  }, [days]);

  const loadBranchAndAnalytics = async () => {
    try {
      setLoading(true);
      const res = await businessService.getMyBusinessAdmin();
      if (res.businesses?.length > 0) {
        const fullBiz: any = await businessService.getBusinessById(res.businesses[0]._id);
        const branches = fullBiz.branches || [];
        if (branches.length > 0) {
          const bid = branches[0]._id;
          setBranchId(bid);
          await fetchAnalytics(bid, days);
        }
      }
    } catch (e) {
      console.log('Analytics load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAnalytics = async (bid: string, d: number) => {
    try {
      const res = await api.get<any>(`/analytics/branch/${bid}?days=${d}`);
      setAnalytics(res.data?.data || null);
    } catch (e) {
      setAnalytics(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBranchAndAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Header title="Analytics" subtitle="Queue performance data" />
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
        >
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={Palette.mutedText} />
            <Text style={styles.emptyTitle}>No Analytics Data Available Yet</Text>
            <Text style={styles.emptySubtitle}>
              Analytics will appear once customers have joined your queues.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const { summary, peakHour, serviceBreakdown } = analytics;

  return (
    <View style={styles.container}>
      <Header title="Analytics" subtitle="Real performance metrics" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {[
            { label: 'Today', value: 1 },
            { label: '7 Days', value: 7 },
            { label: '30 Days', value: 30 },
          ].map((p) => (
            <View
              key={p.value}
              style={[styles.periodBtn, days === p.value && styles.periodBtnActive]}
            >
              <Text
                style={[styles.periodBtnText, days === p.value && styles.periodBtnTextActive]}
                onPress={() => setDays(p.value)}
              >
                {p.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox label="Total" value={summary.total} color={Palette.primary} />
          <StatBox label="Completed" value={summary.completed} color={Palette.success} />
          <StatBox label="Waiting" value={summary.waiting} color="#FF9500" />
          <StatBox label="Cancelled" value={summary.cancelled} color={Palette.danger} />
          <StatBox label="Skipped" value={summary.skipped} color={Palette.mutedText} />
          <StatBox label="No Show" value={summary.noShow} color={Palette.danger} />
        </View>

        {/* KPIs */}
        <Card style={styles.kpiCard}>
          <Text style={styles.sectionTitle}>Performance KPIs</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{summary.avgWaitTime}m</Text>
              <Text style={styles.kpiLabel}>Avg Wait Time</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{summary.avgServiceTime}m</Text>
              <Text style={styles.kpiLabel}>Avg Service Time</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{summary.completionRate}%</Text>
              <Text style={styles.kpiLabel}>Completion Rate</Text>
            </View>
          </View>
        </Card>

        {/* Peak Hour */}
        <Card style={styles.peakCard}>
          <View style={styles.peakRow}>
            <Ionicons name="time-outline" size={24} color={Palette.primary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.peakLabel}>Peak Hours</Text>
              <Text style={styles.peakValue}>{peakHour}</Text>
            </View>
          </View>
        </Card>

        {/* Service Breakdown */}
        {serviceBreakdown && serviceBreakdown.length > 0 && (
          <Card style={styles.serviceCard}>
            <Text style={styles.sectionTitle}>Service-wise Demand</Text>
            {serviceBreakdown.map((item, idx) => {
              const pct = item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0;
              return (
                <View key={idx} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.serviceStats}>
                      {item.count} tokens · {item.completed} completed ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.serviceBarContainer}>
                    <View style={[styles.serviceBar, { width: `${Math.max(pct, 2)}%` as any }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[statBoxStyles.box, { borderColor: color }]}>
      <Text style={[statBoxStyles.value, { color }]}>{value}</Text>
      <Text style={statBoxStyles.label}>{label}</Text>
    </View>
  );
}

const statBoxStyles = StyleSheet.create({
  box: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Palette.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    margin: 4,
  },
  value: { fontSize: 24, fontWeight: '900' },
  label: { fontSize: 10, color: Palette.mutedText, marginTop: 2, textAlign: 'center' },
});

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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Palette.text, marginTop: Spacing.md, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: Palette.mutedText, textAlign: 'center', marginTop: Spacing.xs },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  periodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  periodBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  periodBtnText: { fontSize: 13, fontWeight: '600', color: Palette.text },
  periodBtnTextActive: { color: '#0B0D0E' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: Spacing.sm },
  kpiCard: { marginBottom: Spacing.md, padding: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: Spacing.md },
  kpiRow: { flexDirection: 'row', alignItems: 'center' },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiValue: { fontSize: 24, fontWeight: '800', color: Palette.text },
  kpiLabel: { fontSize: 11, color: Palette.mutedText, marginTop: 4, textAlign: 'center' },
  kpiDivider: { width: 1, height: 40, backgroundColor: Palette.border },
  peakCard: { marginBottom: Spacing.md, padding: Spacing.md },
  peakRow: { flexDirection: 'row', alignItems: 'center' },
  peakLabel: { fontSize: 12, color: Palette.mutedText, fontWeight: '600' },
  peakValue: { fontSize: 18, fontWeight: '700', color: Palette.text },
  serviceCard: { marginBottom: Spacing.md, padding: Spacing.md },
  serviceRow: { marginBottom: Spacing.md },
  serviceInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap' },
  serviceName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  serviceStats: { fontSize: 11, color: Palette.mutedText },
  serviceBarContainer: { height: 6, backgroundColor: Palette.border, borderRadius: 3, overflow: 'hidden' },
  serviceBar: { height: 6, backgroundColor: Palette.primary, borderRadius: 3 },
});
