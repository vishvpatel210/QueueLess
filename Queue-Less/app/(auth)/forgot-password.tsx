import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Palette } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Reset Password" showBack />

      <View style={styles.content}>
        <View style={styles.card}>
          {submitted ? (
            <View>
              <Text style={styles.successTitle}>Check Your Inbox</Text>
              <Text style={styles.subtitle}>
                We sent password reset instructions to {email}
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.button}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email address to receive password reset instructions.
              </Text>

              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Button
                title="Send Reset Instructions"
                onPress={handleSubmit}
                style={styles.button}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.text,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.success,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    marginVertical: Spacing.md,
  },
  button: {
    marginTop: Spacing.md,
  },
});
