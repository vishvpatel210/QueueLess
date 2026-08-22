import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card style={[styles.statCard, accent && styles.statCardAccent]}>
      <Ionicons
        name={icon as any}
        size={22}
        color={accent ? Palette.background : Palette.primary}
      />
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>{label}</Text>
      {sub && (
        <Text style={[styles.statSub, accent && { color: Palette.background }]}>{sub}</Text>
      )}
    </Card>
  );
}

// ─── Horizontal Bar ────────────────────────────────────────────────────────────
function HorizontalBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.hbarRow}>
      <Text style={styles.hbarLabel}>{label}</Text>
      <View style={styles.hbarTrack}>
        <View style={[styles.hbarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.hbarValue}>{value}</Text>
    </View>
  );
}

// ─── Mini Hourly Bars ───────────────────────────────────────────────────────────
const MOCK_HOURLY = [0, 0, 0, 0, 0, 1, 4, 12, 18, 22, 15, 10, 8, 14, 19, 16, 11, 7, 4, 2, 1, 0, 0, 0];

function HourlyChart() {
  const maxVal = Math.max(...MOCK_HOURLY, 1);
  const peakHour = MOCK_HOURLY.indexOf(maxVal);
  return (
    <View>
      <View style={styles.hourlyBars}>
        {MOCK_HOURLY.map((v, i) => (
          <View key={i} style={styles.hourlyBarCol}>
            <View
              style={[
                styles.hourlyBar,
                {
                  height: Math.max(4, (v / maxVal) * 80),
                  backgroundColor: i === peakHour ? Palette.primary : 'rgba(199,243,107,0.3)',
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.hourlyLabels}>
        {['12a', '6a', '12p', '6p', '11p'].map((l, i) => (
          <Text key={i} style={styles.hourlyLabel}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Daily Trend ───────────────────────────────────────────────────────────────
const MOCK_DAILY = [
  { date: 'Mon', total: 34, completed: 29 },
  { date: 'Tue', total: 45, completed: 40 },
  { date: 'Wed', total: 38, completed: 30 },
  { date: 'Thu', total: 52, completed: 47 },
  { date: 'Fri', total: 61, completed: 55 },
  { date: 'Sat', total: 72, completed: 65 },
  { date: 'Sun', total: 28, completed: 24 },
];

function DailyTrendCard() {
  const maxTotal = Math.max(...MOCK_DAILY.map((d) => d.total), 1);
  return (
    <Card style={styles.trendCard}>
      <Text style={styles.sectionTitle}>7-Day Token Volume</Text>
      <View style={styles.trendBars}>
        {MOCK_DAILY.map((d) => {
          const totalH = (d.total / maxTotal) * 100;
          const compH = (d.completed / maxTotal) * 100;
          return (
            <View key={d.date} style={styles.trendCol}>
              <View style={[styles.trendBarBg, { height: totalH }]}>
                <View style={[styles.trendBarFill, { height: compH }]} />
              </View>
              <Text style={styles.trendLabel}>{d.date}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.trendLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Palette.primary }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(199,243,107,0.2)' }]} />
          <Text style={styles.legendText}>Total Issued</Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Branch Leaderboard ────────────────────────────────────────────────────────
const MOCK_BRANCHES = [
  { name: 'Main Street', tokens: 287, rate: 93, avgWait: 8 },
  { name: 'City Center', tokens: 241, rate: 88, avgWait: 12 },
  { name: 'North Wing', tokens: 195, rate: 84, avgWait: 15 },
  { name: 'East End', tokens: 143, rate: 78, avgWait: 18 },
];

function LeaderboardCard() {
  return (
    <Card style={styles.leaderCard}>
      <Text style={styles.sectionTitle}>Branch Leaderboard</Text>
      {MOCK_BRANCHES.map((b, i) => (
        <View
          key={b.name}
          style={[styles.leaderRow, i < MOCK_BRANCHES.length - 1 && styles.leaderBorder]}
        >
          <View style={[styles.rankBadge, i === 0 && styles.rankFirst]}>
            <Text style={[styles.rankText, i === 0 && styles.rankFirstText]}>#{i + 1}</Text>
          </View>
          <View style={styles.leaderInfo}>
            <Text style={styles.leaderName}>{b.name}</Text>
            <Text style={styles.leaderSub}>{b.tokens} tokens · {b.avgWait}m avg wait</Text>
          </View>
          <View style={styles.leaderRate}>
            <Text
              style={[
                styles.leaderRateText,
                { color: b.rate >= 90 ? Palette.success : b.rate >= 80 ? Palette.warning : Palette.danger },
              ]}
            >
              {b.rate}%
            </Text>
            <Text style={styles.leaderRateLabel}>completion</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

// ─── Period Selector ────────────────────────────────────────────────────────────
type Period = 'today' | '7d' | '30d';

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d');

  const periods: { label: string; value: Period }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
  ];

  // Mock summary figures (would come from API in production)
  const summary = {
    total: period === 'today' ? 72 : period === '7d' ? 330 : 1210,
    completed: period === 'today' ? 65 : period === '7d' ? 290 : 1050,
    skipped: period === 'today' ? 4 : period === '7d' ? 25 : 95,
    avgWait: period === 'today' ? 11 : period === '7d' ? 13 : 14,
    completionRate: period === 'today' ? 90 : period === '7d' ? 88 : 87,
  };

  return (
    <View style={styles.container}>
      <Header title="Analytics" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Stats Row */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="ticket-outline"
            label="Total Tokens"
            value={summary.total}
            accent
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={summary.completed}
            sub={`${summary.completionRate}% rate`}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="time-outline"
            label="Avg Wait"
            value={`${summary.avgWait}m`}
            sub="per token"
          />
          <StatCard
            icon="skip-forward-outline"
            label="Skipped"
            value={summary.skipped}
          />
        </View>

        {/* Status Distribution */}
        <Card style={styles.distributionCard}>
          <Text style={styles.sectionTitle}>Token Distribution</Text>
          <HorizontalBar
            label="Completed"
            value={summary.completed}
            total={summary.total}
            color={Palette.success}
          />
          <HorizontalBar
            label="Skipped"
            value={summary.skipped}
            total={summary.total}
            color={Palette.warning}
          />
          <HorizontalBar
            label="Cancelled"
            value={Math.round(summary.total * 0.02)}
            total={summary.total}
            color={Palette.danger}
          />
          <HorizontalBar
            label="Waiting"
            value={summary.total - summary.completed - summary.skipped - Math.round(summary.total * 0.02)}
            total={summary.total}
            color={Palette.primary}
          />
        </Card>

        {/* Hourly Activity Chart */}
        <Card style={styles.hourlyCard}>
          <Text style={styles.sectionTitle}>Hourly Activity</Text>
          <Text style={styles.sectionSubtitle}>Token issuance by hour of day</Text>
          <HourlyChart />
          <View style={styles.peakRow}>
            <Ionicons name="flash-outline" size={14} color={Palette.warning} />
            <Text style={styles.peakText}>Peak: 9:00 – 10:00 AM</Text>
          </View>
        </Card>

        {/* 7-Day Trend */}
        <DailyTrendCard />

        {/* Branch Leaderboard */}
        <LeaderboardCard />

        {/* Completion Rate Gauge */}
        <Card style={styles.gaugeCard}>
          <Text style={styles.sectionTitle}>Overall Completion Rate</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeTrack}>
              <View
                style={[
                  styles.gaugeFill,
                  { width: `${summary.completionRate}%` },
                ]}
              />
            </View>
            <Text style={styles.gaugePercent}>{summary.completionRate}%</Text>
          </View>
          <Text style={styles.gaugeHint}>
            {summary.completionRate >= 90
              ? '🎯 Excellent performance!'
              : summary.completionRate >= 80
              ? '✅ Good — room to improve'
              : '⚠️ Needs attention'}
          </Text>
        </Card>
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
    paddingBottom: Spacing.xxl,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  periodBtnActive: {
    backgroundColor: Palette.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  periodTextActive: {
    color: Palette.background,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  statCardAccent: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.text,
  },
  statValueAccent: {
    color: Palette.background,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.mutedText,
    textAlign: 'center',
  },
  statLabelAccent: {
    color: Palette.background,
    opacity: 0.8,
  },
  statSub: {
    fontSize: 11,
    color: Palette.mutedText,
  },
  distributionCard: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Palette.mutedText,
    marginBottom: Spacing.sm,
  },
  hbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: Spacing.sm,
  },
  hbarLabel: {
    fontSize: 13,
    color: Palette.mutedText,
    width: 72,
  },
  hbarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  hbarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  hbarValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    width: 32,
    textAlign: 'right',
  },
  hourlyCard: {
    marginTop: Spacing.sm,
  },
  hourlyBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  hourlyBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourlyBar: {
    width: '100%',
    borderRadius: 2,
  },
  hourlyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  hourlyLabel: {
    fontSize: 10,
    color: Palette.mutedText,
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  peakText: {
    fontSize: 12,
    color: Palette.warning,
    fontWeight: '600',
  },
  trendCard: {
    marginTop: Spacing.sm,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trendCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  trendBarBg: {
    width: '100%',
    backgroundColor: 'rgba(199,243,107,0.15)',
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    backgroundColor: Palette.primary,
    borderRadius: BorderRadius.sm,
  },
  trendLabel: {
    fontSize: 11,
    color: Palette.mutedText,
  },
  trendLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Palette.mutedText,
  },
  leaderCard: {
    marginTop: Spacing.sm,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  leaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  rankFirst: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.mutedText,
  },
  rankFirstText: {
    color: Palette.background,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  leaderSub: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  leaderRate: {
    alignItems: 'center',
  },
  leaderRateText: {
    fontSize: 18,
    fontWeight: '900',
  },
  leaderRateLabel: {
    fontSize: 10,
    color: Palette.mutedText,
  },
  gaugeCard: {
    marginTop: Spacing.sm,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  gaugeTrack: {
    flex: 1,
    height: 16,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: BorderRadius.full,
  },
  gaugePercent: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.primary,
    width: 56,
    textAlign: 'right',
  },
  gaugeHint: {
    fontSize: 13,
    color: Palette.mutedText,
    fontWeight: '600',
  },
});
