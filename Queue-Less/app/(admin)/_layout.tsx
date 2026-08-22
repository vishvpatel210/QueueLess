import { Stack } from 'expo-router';
import { Palette } from '../../constants/Colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.background },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="queue-management" />
    </Stack>
  );
}
