import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user ? (
          <View>
            <Card style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}

              <View style={styles.roleBadgeContainer}>
                <Badge
                  label={user.role === 'admin' ? 'Business Owner' : 'Customer Account'}
                  variant={user.role === 'admin' ? 'primary' : 'success'}
                />
              </View>
            </Card>

            <Card style={styles.menuCard}>
              <Text style={styles.sectionTitle}>Account & Settings</Text>

              {user.role === 'admin' && (
                <Button
                  title="Switch to Admin Dashboard"
                  variant="outline"
                  onPress={() => router.push('/(admin)/dashboard' as any)}
                  style={styles.menuButton}
                />
              )}

              <Button
                title="Sign Out"
                variant="danger"
                onPress={handleLogout}
                style={styles.menuButton}
              />
            </Card>
          </View>
        ) : (
          <Card style={styles.guestCard}>
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
  scrollContent: {
    padding: Spacing.md,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0B0D0E',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
  },
  userEmail: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 13,
    color: Palette.mutedText,
    marginTop: 2,
  },
  roleBadgeContainer: {
    marginTop: Spacing.md,
  },
  menuCard: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.md,
  },
  menuButton: {
    marginVertical: Spacing.xs,
  },
  guestCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  authButton: {
    width: '100%',
    marginVertical: Spacing.xs,
  },
});
