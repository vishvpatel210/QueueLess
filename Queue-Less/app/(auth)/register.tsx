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
import { UserRole } from '../../types/user';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    setErrorMessage('');
    try {
      await register({ name, email, phone, password, role });
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
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
          <Text style={styles.brandTagline}>Create your digital pass account</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Register</Text>
          <Text style={styles.formSubtitle}>Join thousands skipping the wait</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Role Switcher */}
          <Text style={styles.roleLabel}>Account Type</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'customer' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('customer')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'customer' && styles.roleTextActive,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'admin' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('admin')}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'admin' && styles.roleTextActive,
                ]}
              >
                Business Owner
              </Text>
            </TouchableOpacity>
          </View>

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
            placeholder="+1 234 567 8900"
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

          <Button
            title="Create Account"
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
    fontSize: 14,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  roleOptionActive: {
    backgroundColor: Palette.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  roleTextActive: {
    color: '#0B0D0E',
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
});
