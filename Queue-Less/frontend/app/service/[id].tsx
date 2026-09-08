import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import Input from '../../components/common/Input';
import serviceService, { ServiceWithQueue } from '../../services/serviceService';
import queueService from '../../services/queueService';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [service, setService] = useState<ServiceWithQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [forWhom, setForWhom] = useState<'myself' | 'other'>('myself');
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');

  useEffect(() => {
    if (id) {
      loadServiceDetails();
    }
  }, [id]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getServiceById(id);
      setService(data);
    } catch (err) {
      console.log('Error loading service:', err);
    } finally {
      setLoading(false);
    }
  };

  const isStopped = service ? (service.isActive === false || service.queue?.status === 'PAUSED' || service.queue?.status === 'CLOSED') : false;

  const handleBookToken = async () => {
    if (isStopped) {
      Alert.alert(
        'Service Stopped',
        'This queue service is currently stopped / paused by the counter staff. Tokens cannot be generated at this moment.'
      );
      return;
    }

    if (!service || !service.queue) {
      Alert.alert('Queue Unavailable', 'The queue for this service is not open today.');
      return;
    }

    if (forWhom === 'other' && !personName.trim()) {
      Alert.alert('Missing Details', 'Please enter the name of the person this token is for.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await queueService.joinQueue(
        service.queue._id,
        forWhom === 'myself' ? 'Myself' : personName.trim(),
        forWhom === 'other' ? personPhone.trim() : undefined
      );

      // Navigate to live token status screen
      router.replace(`/token/${result.token._id}` as any);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to issue token.';
      Alert.alert('Booking Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading queue service...</Text>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.errorText}>Service not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </SafeAreaView>
    );
  }

  const waitingCount = service.queue?.waitingCount || 0;
  const currentToken = service.queue?.currentTokenNumber || 'None';
  const estWait = waitingCount * service.estimatedDurationMinutes;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Join Live Queue" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Service Header Card */}
        <Card style={styles.card}>
          <Text style={styles.serviceTitle}>{service.name}</Text>
          <Text style={styles.branchName}>
            {service.branchId?.name || 'Registered Branch'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={isStopped ? '⏸ SERVICE TEMPORARILY STOPPED' : 'QUEUE IS OPEN TODAY'}
              variant={isStopped ? 'warning' : 'success'}
            />
            <Badge label={`Prefix: ${service.prefix}`} variant="primary" />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{waitingCount}</Text>
              <Text style={styles.statLabel}>People Ahead</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentToken}</Text>
              <Text style={styles.statLabel}>Serving Token</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>~{estWait}m</Text>
              <Text style={styles.statLabel}>Est. Wait</Text>
            </View>
          </View>
        </Card>

        {/* Appointment For Switcher */}
        <Text style={styles.sectionTitle}>Token Issued For</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchOption,
              forWhom === 'myself' && styles.switchActive,
            ]}
            onPress={() => setForWhom('myself')}
          >
            <Ionicons
              name="person"
              size={18}
              color={forWhom === 'myself' ? '#0B0D0E' : Palette.mutedText}
            />
            <Text
              style={[
                styles.switchText,
                forWhom === 'myself' && styles.switchTextActive,
              ]}
            >
              Myself
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchOption,
              forWhom === 'other' && styles.switchActive,
            ]}
            onPress={() => setForWhom('other')}
          >
            <Ionicons
              name="people"
              size={18}
              color={forWhom === 'other' ? '#0B0D0E' : Palette.mutedText}
            />
            <Text
              style={[
                styles.switchText,
                forWhom === 'other' && styles.switchTextActive,
              ]}
            >
              Family / Friend
            </Text>
          </TouchableOpacity>
        </View>

        {forWhom === 'other' ? (
          <Card style={styles.otherInputCard}>
            <Input
              label="Person Full Name *"
              placeholder="e.g. John Doe"
              value={personName}
              onChangeText={setPersonName}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={personPhone}
              onChangeText={setPersonPhone}
              keyboardType="phone-pad"
            />
          </Card>
        ) : null}

        <Button
          title={isStopped ? '⏸ Service Currently Stopped' : 'Confirm & Generate Real Token'}
          loading={submitting}
          onPress={handleBookToken}
          style={[styles.confirmBtn, isStopped && { backgroundColor: Palette.border, borderColor: Palette.border }]}
        />
      </ScrollView>
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
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
  },
  branchName: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Palette.mutedText,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginVertical: Spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: Spacing.md,
  },
  switchOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  switchActive: {
    backgroundColor: Palette.primary,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  switchTextActive: {
    color: '#0B0D0E',
    fontWeight: '700',
  },
  otherInputCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  confirmBtn: {
    marginTop: Spacing.sm,
  },
});
