import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { notificationService } from '../services/notificationService';

interface NotificationSetting {
  id: string;
  icon: string;
  title: string;
  description: string;
  key: keyof NotificationPreferences;
}

interface NotificationPreferences {
  queueJoined: boolean;
  approaching: boolean;
  yourTurn: boolean;
  tokenSkipped: boolean;
  serviceCompleted: boolean;
  queueStatusChanges: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: 'queueJoined',
    icon: 'checkmark-circle-outline',
    title: 'Queue Joined',
    description: 'Notify when your token is successfully issued',
    key: 'queueJoined',
  },
  {
    id: 'approaching',
    icon: 'time-outline',
    title: 'Almost Your Turn',
    description: 'Alert when only 2–3 people are ahead of you',
    key: 'approaching',
  },
  {
    id: 'yourTurn',
    icon: 'notifications-outline',
    title: "It's Your Turn",
    description: 'Immediate notification when your token is called',
    key: 'yourTurn',
  },
  {
    id: 'tokenSkipped',
    icon: 'arrow-forward-circle-outline',
    title: 'Token Skipped',
    description: 'Alert if your token is skipped by staff',
    key: 'tokenSkipped',
  },
  {
    id: 'serviceCompleted',
    icon: 'ribbon-outline',
    title: 'Service Completed',
    description: 'Confirmation after your service is marked done',
    key: 'serviceCompleted',
  },
  {
    id: 'queueStatusChanges',
    icon: 'pause-circle-outline',
    title: 'Queue Status Changes',
    description: 'Alert on queue pause, resume, or closure',
    key: 'queueStatusChanges',
  },
];

export default function NotificationsScreen() {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    queueJoined: true,
    approaching: true,
    yourTurn: true,
    tokenSkipped: true,
    serviceCompleted: false,
    queueStatusChanges: false,
  });

  const handleRequestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionsGranted(granted);
    if (granted) {
      Alert.alert('✅ Permissions Granted', 'QueueLess can now send you notifications.');
    } else {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive queue updates.'
      );
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestNotification = async () => {
    await notificationService.notifyApproaching(2);
    Alert.alert(
      '📬 Test Sent',
      'A sample notification has been queued. Check your notification tray.'
    );
  };

  const enableAll = () => {
    setPreferences({
      queueJoined: true,
      approaching: true,
      yourTurn: true,
      tokenSkipped: true,
      serviceCompleted: true,
      queueStatusChanges: true,
    });
  };

  const disableAll = () => {
    setPreferences({
      queueJoined: false,
      approaching: false,
      yourTurn: false,
      tokenSkipped: false,
      serviceCompleted: false,
      queueStatusChanges: false,
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permission Banner */}
        {!permissionsGranted && (
          <Card style={styles.permissionBanner}>
            <Ionicons name="notifications-off-outline" size={32} color={Palette.warning} />
            <Text style={styles.bannerTitle}>Notifications Disabled</Text>
            <Text style={styles.bannerBody}>
              Enable notifications so QueueLess can alert you when your turn is approaching.
            </Text>
            <Button
              title="Enable Notifications"
              onPress={handleRequestPermissions}
              style={styles.enableBtn}
            />
          </Card>
        )}

        {/* Bulk actions */}
        <View style={styles.bulkRow}>
          <TouchableOpacity style={styles.bulkBtn} onPress={enableAll}>
            <Ionicons name="checkmark-done-outline" size={16} color={Palette.primary} />
            <Text style={styles.bulkText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkBtn} onPress={disableAll}>
            <Ionicons name="close-circle-outline" size={16} color={Palette.danger} />
            <Text style={[styles.bulkText, { color: Palette.danger }]}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* Individual Toggles */}
        <Card style={styles.settingsCard}>
          {NOTIFICATION_SETTINGS.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.settingRow,
                index < NOTIFICATION_SETTINGS.length - 1 && styles.settingBorder,
              ]}
            >
              <View style={styles.settingIconContainer}>
                <Ionicons
                  name={setting.icon as any}
                  size={20}
                  color={preferences[setting.key] ? Palette.primary : Palette.mutedText}
                />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDesc}>{setting.description}</Text>
              </View>
              <Switch
                value={preferences[setting.key]}
                onValueChange={() => handleToggle(setting.key)}
                trackColor={{ false: Palette.border, true: 'rgba(199,243,107,0.4)' }}
                thumbColor={preferences[setting.key] ? Palette.primary : Palette.mutedText}
              />
            </View>
          ))}
        </Card>

        {/* Test Notification */}
        <Card style={styles.testCard}>
          <View style={styles.testRow}>
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test Notifications</Text>
              <Text style={styles.testDesc}>Send a sample notification to test your settings</Text>
            </View>
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Ionicons name="send-outline" size={18} color={Palette.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Palette.primary} />
          <Text style={styles.infoText}>
            Notifications are delivered locally on your device for real-time queue alerts.
            Push notifications via Expo are available for production deployment.
          </Text>
        </Card>
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
    paddingBottom: Spacing.xxl,
  },
  permissionBanner: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Palette.warning,
    marginBottom: Spacing.md,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.text,
    marginTop: Spacing.sm,
  },
  bannerBody: {
    fontSize: 14,
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  enableBtn: {
    marginTop: Spacing.md,
    width: '100%',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bulkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  settingsCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  settingDesc: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
    lineHeight: 16,
  },
  testCard: {
    marginTop: Spacing.md,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  testDesc: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  testButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(199,243,107,0.12)',
    borderWidth: 1,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Palette.mutedText,
    lineHeight: 18,
  },
});
