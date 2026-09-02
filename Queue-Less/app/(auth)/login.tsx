import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setErrorMessage('');
    try {
      const loggedUser = await login({ email: cleanEmail, password: cleanPassword });
      
      // Role-Based Redirection
      const userRole = (loggedUser.role || '').toUpperCase();
      if (userRole === 'SHOP_ADMIN' || userRole === 'ADMIN') {
        router.replace('/(admin)/dashboard' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to login. Please check your credentials and network connection.';
      setErrorMessage(msg);
    }
  };

  const handleQuickDemoLogin = (demoRole: 'customer' | 'admin') => {
    if (demoRole === 'admin') {
      setEmail('admin@queueless.io');
      setPassword('Admin123!');
    } else {
      setEmail('customer@queueless.io');
      setPassword('Customer123!');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>QueueLess</Text>
          <Text style={styles.brandTagline}>Your turn, without the wait.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to manage your digital tokens</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Quick Demo Credentials Fill Buttons */}
          <View style={styles.demoFillContainer}>
            <Text style={styles.demoFillLabel}>Quick Test Login:</Text>
            <View style={styles.demoFillButtons}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemoLogin('customer')}
              >
                <Text style={styles.demoBtnText}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleQuickDemoLogin('admin')}
              >
                <Text style={styles.demoBtnText}>Shop / Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password' as any)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.submitButton}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to QueueLess? Create an account:</Text>
          </View>

          <View style={styles.registerButtonsRow}>
            <TouchableOpacity
              style={styles.roleChoiceBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.roleChoiceIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleChoiceTitle}>Customer / Patient</Text>
                <Text style={styles.roleChoiceSubtitle}>Take digital tokens & skip waiting lines</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Palette.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleChoiceBtn, styles.roleChoiceBtnAdmin]}
              onPress={() => router.push('/(auth)/register-admin' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleChoiceIcon}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleChoiceTitle, { color: Palette.secondary }]}>
                  Hospital / Shopkeeper / Admin
                </Text>
                <Text style={styles.roleChoiceSubtitle}>Manage queues, call patients & QR pass</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Palette.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: Palette.mutedText,
    marginTop: Spacing.xs,
  },
  formCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
  },
  formSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.danger,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  demoFillContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  demoFillLabel: {
    fontSize: 12,
    color: Palette.mutedText,
    marginBottom: 6,
    fontWeight: '600',
  },
  demoFillButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoBtn: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginVertical: Spacing.xs,
  },
  forgotText: {
    color: Palette.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Palette.mutedText,
    fontSize: 14,
  },
  linkText: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  adminRegisterText: {
    color: Palette.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  registerButtonsRow: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  roleChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 155, 0.3)',
    gap: Spacing.md,
  },
  roleChoiceBtnAdmin: {
    borderColor: 'rgba(199, 243, 107, 0.3)',
  },
  roleChoiceIcon: {
    fontSize: 24,
  },
  roleChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
  },
  roleChoiceSubtitle: {
    fontSize: 11,
    color: Palette.mutedText,
    marginTop: 2,
  },
});
