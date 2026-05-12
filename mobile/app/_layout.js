// app/_layout.js  — Root layout for Expo Router
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const { hydrate, hydrated } = useAuthStore();

  useEffect(() => { hydrate(); }, []);

  if (!hydrated) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  );
}
