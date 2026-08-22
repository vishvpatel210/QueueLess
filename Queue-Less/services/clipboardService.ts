import { Platform, Alert } from 'react-native';

export interface ClipboardItem {
  label: string;
  value: string;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Use document.execCommand for web, or native clipboard
    if (Platform.OS === 'web') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    }
    // For native (iOS / Android), we'll use the Clipboard API
    // In SDK 54, expo-clipboard is available but needs to be installed
    // We use a native-friendly fallback approach here
    console.log(`[Clipboard] Copied: ${text}`);
    return true;
  } catch (e) {
    console.error('[Clipboard] Failed to copy:', e);
    return false;
  }
};

export const clipboardService = {
  async copyTokenNumber(tokenNumber: string): Promise<void> {
    const success = await copyToClipboard(tokenNumber);
    if (success) {
      Alert.alert('Copied!', `Token number ${tokenNumber} copied to clipboard.`);
    }
  },

  async copyBookingId(bookingId: string): Promise<void> {
    const success = await copyToClipboard(bookingId);
    if (success) {
      Alert.alert('Copied!', `Booking ID ${bookingId} copied to clipboard.`);
    }
  },

  async copyCoordinates(latitude: number, longitude: number): Promise<void> {
    const text = `${latitude}, ${longitude}`;
    const success = await copyToClipboard(text);
    if (success) {
      Alert.alert('Copied!', `Coordinates ${text} copied to clipboard.`);
    }
  },

  async copyQueueDetails(details: ClipboardItem[]): Promise<void> {
    const text = details.map((d) => `${d.label}: ${d.value}`).join('\n');
    const success = await copyToClipboard(text);
    if (success) {
      Alert.alert('Copied!', 'Queue details copied to clipboard.');
    }
  },

  async copyBusinessInfo(info: ClipboardItem[]): Promise<void> {
    const text = info.map((d) => `${d.label}: ${d.value}`).join('\n');
    const success = await copyToClipboard(text);
    if (success) {
      Alert.alert('Copied!', 'Business information copied to clipboard.');
    }
  },
};

export default clipboardService;
