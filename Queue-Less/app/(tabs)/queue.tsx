import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '../../constants/Colors';
import { Spacing } from '../../constants/theme';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';

export default function QueueTabScreen() {
  return (
    <View style={styles.container}>
      <Header title="My Live Token" />
      <View style={styles.content}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Token</Text>
          <Text style={styles.emptySubtitle}>
            Explore nearby businesses and join a queue to receive your digital token.
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
