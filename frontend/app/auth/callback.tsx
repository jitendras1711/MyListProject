import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform, View, Text } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Expo AuthSession should handle the callback automatically.
      // Navigate back to login in case the auth flow does not complete.
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Completing sign-in…</Text>
      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        If this page does not redirect automatically, please go back to the login screen.
      </Text>
    </View>
  );
}
