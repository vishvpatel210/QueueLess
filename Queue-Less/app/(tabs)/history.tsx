import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';

export default function HistoryTabScreen() {
  return (
    <View style={styles.container}>
      <Header title="Queue History" />
      <View style={styles.content}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Past Tokens</Text>
          <Text style={styles.emptySubtitle}>
            Your completed and past queue tokens will appear here.
          </Text>
        </Card>
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
    padding: Spacing.md,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
  },
});
