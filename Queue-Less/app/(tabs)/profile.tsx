import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Profile" />
        <View style={styles.center}>
          <Card style={styles.guestCard}>
            <Ionicons name="person-circle-outline" size={64} color={Palette.mutedText} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.guestTitle}>Welcome to QueueLess</Text>
            <Text style={styles.guestSubtitle}>
              Sign in or create an account to join queues and track your digital tokens in real time.
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              style={styles.authButton}
            />
            <Button
              title="Create Account"
              variant="outline"
              onPress={() => router.push('/(auth)/register')}
              style={styles.authButton}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <View style={styles.roleBadgeContainer}>
            <Badge label="Customer Account" variant="success" />
          </View>
        </Card>

        {/* Account Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color={Palette.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={18} color={Palette.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
          </View>

          {user.phone ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={18} color={Palette.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{user.phone}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Palette.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>Customer</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={20} color={Palette.text} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={Palette.mutedText} />
          </View>

          <View style={styles.settingRow}>
            <Ionicons name="location-outline" size={20} color={Palette.text} />
            <Text style={styles.settingText}>Location Permissions</Text>
            <Ionicons name="chevron-forward" size={16} color={Palette.mutedText} />
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  center: { flex: 1, justifyContent: 'center', padding: Spacing.md },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  userCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.md },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#0B0D0E' },
  userName: { fontSize: 22, fontWeight: '700', color: Palette.text },
  userEmail: { fontSize: 14, color: Palette.mutedText, marginTop: 4 },
  userPhone: { fontSize: 13, color: Palette.mutedText, marginTop: 2 },
  roleBadgeContainer: { marginTop: Spacing.md },
  sectionCard: { marginBottom: Spacing.md, padding: Spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: Palette.mutedText, fontWeight: '600' },
  detailValue: { fontSize: 14, color: Palette.text, fontWeight: '500', marginTop: 2 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  settingText: { flex: 1, fontSize: 14, color: Palette.text, fontWeight: '500' },
  logoutBtn: { marginBottom: Spacing.xl },
  guestCard: { padding: Spacing.xl, alignItems: 'center' },
  guestTitle: { fontSize: 22, fontWeight: '700', color: Palette.text, textAlign: 'center' },
  guestSubtitle: { fontSize: 14, color: Palette.mutedText, textAlign: 'center', marginVertical: Spacing.md },
  authButton: { width: '100%', marginVertical: Spacing.xs },
});
