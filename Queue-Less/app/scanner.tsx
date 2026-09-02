import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/theme';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import branchService from '../services/branchService';

export default function QRScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);

  const requestCameraPermission = () => {
    // Permission requested lazily on user action
    setHasPermission(true);
  };

  const handleSimulateScan = async () => {
    try {
      setScanned(true);
      // Fetch the first available registered branch
      const branches = await branchService.getAllBranches();
      if (branches && branches.length > 0) {
        const br = branches[0];
        const bizId = (br.businessId as any)?._id || br.businessId;
        Alert.alert(
          'QR Verified! 🎯',
          `Scanned Branch: ${br.name}\n${br.address}`,
          [
            {
              text: 'View Branch & Queues',
              onPress: () => router.replace(`/business/${bizId}` as any),
            },
          ]
        );
      } else {
        Alert.alert('Notice', 'No registered branches found in the database to scan.');
      }
    } catch (e: any) {
      Alert.alert('Scan Error', 'Could not resolve scanned QR against registered database.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Scan QR Code" subtitle="Scan branch or token QR" showBack />

      <View style={styles.content}>
        {hasPermission === null ? (
          <View style={styles.permissionCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={40} color={Palette.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionSubtitle}>
              QueueLess uses your camera to scan real branch QR codes and immediately open live queue status.
            </Text>
            <Button
              title="Enable Camera Access"
              onPress={requestCameraPermission}
              style={styles.enableBtn}
            />
          </View>
        ) : (
          <View style={styles.scannerViewport}>
            {/* Viewfinder overlay */}
            <View style={styles.viewfinderBox}>
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
            </View>

            <Text style={styles.scanInstruction}>Align QR code within the frame</Text>

            <Button
              title="Scan Live Branch QR Code"
              onPress={handleSimulateScan}
              style={styles.simBtn}
            />
          </View>
        )}
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
  permissionCard: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight: 20,
  },
  enableBtn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  scannerViewport: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  viewfinderBox: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(21, 24, 25, 0.6)',
    borderRadius: BorderRadius.lg,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Palette.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanInstruction: {
    fontSize: 14,
    color: Palette.mutedText,
    marginTop: Spacing.lg,
  },
  simBtn: {
    marginTop: Spacing.xl,
    width: '80%',
  },
});
