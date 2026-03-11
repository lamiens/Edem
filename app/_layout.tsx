import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="create/photo" />
        <Stack.Screen name="create/region" />
        <Stack.Screen name="create/questions" />
        <Stack.Screen name="create/loading" />
        <Stack.Screen name="create/story" />
        <Stack.Screen name="create/export" />
        <Stack.Screen name="library" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
