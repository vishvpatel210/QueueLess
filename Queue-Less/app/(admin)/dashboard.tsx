import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

interface WaitingCustomer {
  id: string;
  tokenNumber: string;
  name: string;
  forPerson: string;
  waitTime: string;
}

const MOCK_WAITING: WaitingCustomer[] = [
  { id: 't1', tokenNumber: 'A-118', name: 'John Doe', forPerson: 'Myself', waitTime: '5m' },
  { id: 't2', tokenNumber: 'A-119', name: 'Sarah Smith', forPerson: 'Someone else (David)', waitTime: '12m' },
  { id: 't3', tokenNumber: 'A-120', name: 'Michael Brown', forPerson: 'Myself', waitTime: '20m' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();

  const [queueStatus, setQueueStatus] = useState<'OPEN' | 'PAUSED' | 'CLOSED'>('OPEN');
  const [currentToken, setCurrentToken] = useState<string>('A-117');
  const [waitingList, setWaitingList] = useState<WaitingCustomer[]>(MOCK_WAITING);
  const [completedCount, setCompletedCount] = useState<number>(24);

  const handleCallNext = () => {
    if (waitingList.length === 0) {
      Alert.alert('Queue Empty', 'There are no waiting customers in line.');
      return;
    }
    const nextCustomer = waitingList[0];
    setCurrentToken(nextCustomer.tokenNumber);
    setWaitingList(waitingList.slice(1));
    setCompletedCount(completedCount + 1);
  };

  const handlePauseResume = () => {
    if (queueStatus === 'OPEN') {
      setQueueStatus('PAUSED');
    } else {
      setQueueStatus('OPEN');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Queue Control Center"
        subtitle="Apex Health Clinic"
        showBack
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(admin)/queue-management')}>
            <Ionicons name="settings-outline" size={24} color={Palette.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Controller Bar */}
        <Card style={styles.statusControlCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <Badge
              label={queueStatus}
              variant={queueStatus === 'OPEN' ? 'success' : queueStatus === 'PAUSED' ? 'warning' : 'danger'}
            />
          </View>
          <Button
            title={queueStatus === 'OPEN' ? 'Pause Queue' : 'Resume Queue'}
            variant={queueStatus === 'OPEN' ? 'secondary' : 'primary'}
            onPress={handlePauseResume}
            style={styles.statusBtn}
          />
        </Card>

        {/* Current Active Token Banner */}
        <Card style={styles.currentTokenCard}>
          <Text style={styles.cardHeaderTitle}>CURRENTLY SERVING TOKEN</Text>
          <Text style={styles.currentTokenDisplay}>{currentToken}</Text>
          <Text style={styles.currentTokenInfo}>General OPD Consultation • Counter 1</Text>

          {/* Primary Action Button */}
          <Button
            title="CALL NEXT CUSTOMER ➔"
            onPress={handleCallNext}
            style={styles.callNextBtn}
          />

          <View style={styles.subActionsRow}>
            <Button
              title="Skip"
              variant="outline"
              onPress={() => Alert.alert('Customer Skipped')}
              style={styles.subActionBtn}
            />
            <Button
              title="Mark Complete"
              variant="secondary"
              onPress={() => Alert.alert('Service Completed')}
              style={styles.subActionBtn}
            />
          </View>
        </Card>

        {/* Metrics Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{waitingList.length}</Text>
            <Text style={styles.statLabel}>Waiting in Line</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>11m</Text>
            <Text style={styles.statLabel}>Avg Wait Time</Text>
          </View>
        </View>

        {/* Waiting Customers Queue List */}
        <Text style={styles.sectionTitle}>Waiting Customers ({waitingList.length})</Text>

        {waitingList.map((item) => (
          <Card key={item.id} style={styles.customerRowCard}>
            <View style={styles.customerRowLeft}>
              <View style={styles.tokenTag}>
                <Text style={styles.tokenTagText}>{item.tokenNumber}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.forPerson}>{item.forPerson}</Text>
              </View>
            </View>
            <Badge label={`Wait ${item.waitTime}`} variant="muted" />
          </Card>
        ))}
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
  },
  statusControlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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
  callNextBtn: {
    width: '100%',
    marginTop: Spacing.lg,
    height: 56,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  subActionBtn: {
    flex: 1,
    height: 44,
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
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.sm,
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
