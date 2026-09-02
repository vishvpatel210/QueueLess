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
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export default function CustomerRegisterScreen() {
  const router = useRouter();
  const { registerCustomer, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Password is required.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    try {
      await registerCustomer({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPassword,
        confirmPassword: cleanConfirm,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your details and try again.';
      setErrorMessage(msg);
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
          <Text style={styles.brandTagline}>Smart Digital Queue Platform</Text>
        </View>

        {/* Role Switcher Tabs */}
        <View style={styles.roleSwitcherContainer}>
          <TouchableOpacity
            style={[styles.roleTab, styles.roleTabActive]}
            activeOpacity={0.9}
          >
            <Text style={styles.roleTabIcon}>👤</Text>
            <Text style={[styles.roleTabText, styles.roleTabTextActive]}>
              Customer / Patient
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleTab}
            onPress={() => router.replace('/(auth)/register-admin' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.roleTabIcon}>🏢</Text>
            <Text style={styles.roleTabText}>Hospital / Shop</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Customer / Patient Sign Up</Text>
          <Text style={styles.formSubtitle}>
            Join digital queues, take tokens, and track waiting time live
          </Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Email Address *"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Password *"
            placeholder="Min 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirm Password *"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Create Customer Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.submitButton}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.adminRegisterLink}
            onPress={() => router.push('/(auth)/register-admin' as any)}
          >
            <Text style={styles.adminRegisterText}>Register as Shop / Hospital Admin →</Text>
          </TouchableOpacity>
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
    paddingVertical: Spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Palette.primary,
  },
  brandTagline: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: 2,
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
  adminRegisterLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  adminRegisterText: {
    color: Palette.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: Palette.primary,
  },
  roleTabIcon: {
    fontSize: 15,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.mutedText,
  },
  roleTabTextActive: {
    color: '#0B0D0E',
  },
});
