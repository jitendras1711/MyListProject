import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { getToken, removeToken } from '../utils/storage';
import { useThemeContext } from '@/hooks/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider as AppThemeProvider } from '@/hooks/theme-context';
import { Platform } from 'react-native';
import { isTokenExpired, refreshAuthToken } from '@/utils/auth';



export const unstable_settings = {
  anchor: '(tabs)',
};
export default function RootLayout() {
  return (
    <AppThemeProvider>
      <InnerRootLayout />
    </AppThemeProvider>
  );
}

function InnerRootLayout() {
  const { theme: contextTheme } = useThemeContext();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await getToken('userToken');
      const inAuthGroup = (segments[0] as string) === 'login';
      const inAuthCallback = (segments[0] as string) === 'auth' && (segments[1] as string) === 'callback';

      if (token) {
        let refreshedToken: string | null = null;

        if (Platform.OS === 'web') {
          const isExpired = isTokenExpired(token);
          if (isExpired) {
            refreshedToken = await refreshAuthToken();
            if (!refreshedToken) {
              await removeToken('userToken');
              router.replace('/login');
              return;
            }
          }
        } else {
          try {
            refreshedToken = await refreshAuthToken();
            if (!refreshedToken) {
              router.replace('/login');
              return;
            }
          } catch {
            router.replace('/login');
            return;
          }
        }

        if (inAuthGroup) router.replace('/');
      } else if (!inAuthGroup && !inAuthCallback) {
        router.replace('/login');
      }

      setIsReady(true);
    };

    checkLogin();
  }, [segments]);

  // Don't render anything until we know the auth state
  if (!isReady) return null;

//   const handleLogout = async () => {
//   await removeToken('userToken');
//   router.replace('/login');
// };

  return (
    <ThemeProvider value={contextTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* We add the login screen to the stack */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="terms" options={{ title: 'Terms and Conditions' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Sub-tasks' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}