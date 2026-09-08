import { Platform } from 'react-native';

export type NotificationType =
  | 'QUEUE_JOINED'
  | 'APPROACHING'
  | 'YOUR_TURN'
  | 'TOKEN_CALLED'
  | 'TOKEN_SKIPPED'
  | 'TOKEN_COMPLETED'
  | 'QUEUE_PAUSED'
  | 'QUEUE_CLOSED';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean;
  vibrate?: boolean;
}

const buildNotificationPayload = (
  type: NotificationType,
  params: Record<string, string> = {}
): NotificationPayload => {
  const templates: Record<NotificationType, NotificationPayload> = {
    QUEUE_JOINED: {
      title: '🎫 Queue Joined Successfully!',
      body: `Your token ${params.token ?? ''} has been issued for ${params.service ?? 'the service'}.`,
      sound: true,
      vibrate: true,
    },
    APPROACHING: {
      title: '⏳ Almost Your Turn!',
      body: `Only ${params.ahead ?? '2'} people ahead of you. Get ready!`,
      sound: true,
      vibrate: true,
    },
    YOUR_TURN: {
      title: '🔔 It\'s Your Turn Now!',
      body: `Token ${params.token ?? ''} — please proceed to the counter at ${params.branch ?? 'the service point'}.`,
      sound: true,
      vibrate: true,
    },
    TOKEN_CALLED: {
      title: '📢 Token Called',
      body: `Token ${params.token ?? ''} has been called. Please proceed immediately.`,
      sound: true,
      vibrate: true,
    },
    TOKEN_SKIPPED: {
      title: '⚠️ Token Skipped',
      body: `Token ${params.token ?? ''} was skipped. If this was you, please contact the staff.`,
      sound: false,
      vibrate: false,
    },
    TOKEN_COMPLETED: {
      title: '✅ Service Completed',
      body: `Your service at ${params.branch ?? 'the branch'} is complete. Thank you for using QueueLess!`,
      sound: false,
      vibrate: false,
    },
    QUEUE_PAUSED: {
      title: '⏸️ Queue Paused',
      body: `The queue at ${params.branch ?? 'the branch'} has been temporarily paused. Please wait.`,
      sound: false,
      vibrate: false,
    },
    QUEUE_CLOSED: {
      title: '🚫 Queue Closed',
      body: `The queue at ${params.branch ?? 'the branch'} is now closed for the day.`,
      sound: false,
      vibrate: false,
    },
  };

  return templates[type];
};

const scheduleLocalNotification = async (
  payload: NotificationPayload,
  delaySeconds: number = 0
): Promise<boolean> => {
  // In Expo SDK 54, expo-notifications must be installed via eas/expo install.
  // This function provides the notification logic interface.
  // For local delivery, a Notification Manager API is used.
  try {
    console.log(`[NotificationService] Scheduling notification in ${delaySeconds}s:`, payload);

    // When expo-notifications is available, this maps to:
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: payload.title,
    //     body: payload.body,
    //     data: payload.data ?? {},
    //     sound: payload.sound,
    //   },
    //   trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    // });

    return true;
  } catch (e) {
    console.error('[NotificationService] Failed to schedule notification:', e);
    return false;
  }
};

const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    // Permissions are handled via expo-notifications:
    // const { status } = await Notifications.requestPermissionsAsync();
    // return status === 'granted';
    console.log('[NotificationService] Permissions requested');
    return true;
  } catch (e) {
    console.error('[NotificationService] Permission request failed:', e);
    return false;
  }
};

export const notificationService = {
  requestPermissions,

  async notifyQueueJoined(token: string, service: string): Promise<boolean> {
    const payload = buildNotificationPayload('QUEUE_JOINED', { token, service });
    return scheduleLocalNotification(payload);
  },

  async notifyApproaching(ahead: number): Promise<boolean> {
    const payload = buildNotificationPayload('APPROACHING', { ahead: String(ahead) });
    return scheduleLocalNotification(payload);
  },

  async notifyYourTurn(token: string, branch: string): Promise<boolean> {
    const payload = buildNotificationPayload('YOUR_TURN', { token, branch });
    return scheduleLocalNotification(payload);
  },

  async notifyTokenCalled(token: string): Promise<boolean> {
    const payload = buildNotificationPayload('TOKEN_CALLED', { token });
    return scheduleLocalNotification(payload);
  },

  async notifyTokenSkipped(token: string): Promise<boolean> {
    const payload = buildNotificationPayload('TOKEN_SKIPPED', { token });
    return scheduleLocalNotification(payload);
  },

  async notifyServiceCompleted(branch: string): Promise<boolean> {
    const payload = buildNotificationPayload('TOKEN_COMPLETED', { branch });
    return scheduleLocalNotification(payload);
  },

  async notifyQueuePaused(branch: string): Promise<boolean> {
    const payload = buildNotificationPayload('QUEUE_PAUSED', { branch });
    return scheduleLocalNotification(payload);
  },

  async notifyQueueClosed(branch: string): Promise<boolean> {
    const payload = buildNotificationPayload('QUEUE_CLOSED', { branch });
    return scheduleLocalNotification(payload);
  },

  async scheduleApproachingAlert(
    token: string,
    ahead: number,
    avgWaitSeconds: number
  ): Promise<boolean> {
    const delaySeconds = Math.max(0, (ahead - 2) * avgWaitSeconds);
    const payload = buildNotificationPayload('APPROACHING', { token, ahead: String(ahead) });
    return scheduleLocalNotification(payload, delaySeconds);
  },
};

export default notificationService;
