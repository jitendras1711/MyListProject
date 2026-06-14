import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { saveToken } from '../utils/storage'; // Adjusted path
import { useThemeContext } from '@/hooks/theme-context';

WebBrowser.maybeCompleteAuthSession();

if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: '192788138454-6cvomopeu4lg6ppvbm288bqcrejgcibe.apps.googleusercontent.com',
  });
}

export default function LoginScreen() {
  const router = useRouter();
  const { theme: contextTheme } = useThemeContext();
  const theme = Colors[contextTheme];
  const isDark = contextTheme === 'dark';
  const webRedirectUri = typeof window !== 'undefined'
    ? makeRedirectUri({ useProxy: false })
    : undefined;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '192788138454-dk8gf75h5kuiia9346enup99ub9i7inn.apps.googleusercontent.com',
    webClientId: '192788138454-6cvomopeu4lg6ppvbm288bqcrejgcibe.apps.googleusercontent.com',
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: webRedirectUri,
  });

  useEffect(() => {
  const handleWebSignIn = async () => {
    if (Platform.OS === 'web' && response?.type === 'success') {
      const token = response.params?.id_token || response.authentication?.idToken; 

      if (token) {
        await saveToken('userToken', token);
        router.replace('/(tabs)');
      } else {
        console.error("ID Token missing. Ensure 'responseType: id_token' is in useAuthRequest.");
      }
    }
  };

  handleWebSignIn();
}, [response]);

  const nativeSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const res = await GoogleSignin.signIn();
      // LOG THIS: Ensure it starts with 'eyJ...' and NOT 'ya29'
      console.log("Android ID Token:", res.data?.idToken);
      const token = res.data?.idToken;
      if (token) {
        await saveToken('userToken', token);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error("Native Login Error:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: isDark ? theme.card : '#fff' }]}> 
            <Ionicons name="flash" size={40} color="#4361EE" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Atomize</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A8B0BB' : '#6C757D' }]}>Micro tasks. Massive results.</Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}> 
          <Text style={[styles.cardHeader, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.cardSub, { color: isDark ? '#A8B0BB' : '#ADB5BD' }]}>Sign in to continue your streak</Text>
          
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={() => {
              if (Platform.OS === 'web') {
                console.log('Auth URL:', request?.url);
                console.log('Forced redirectUri:', webRedirectUri);
                promptAsync({ useProxy: false });
              } else {
                nativeSignIn();
              }
            }}
            disabled={Platform.OS === 'web' && !request}
          >
            <Ionicons name="logo-google" size={20} color="white" />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: isDark ? '#A8B0BB' : '#ADB5BD' }]}>By signing in, you agree to our Terms.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 30 
  },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 25, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20
  },
  title: { fontSize: 36, fontWeight: '800', color: '#1A1A1B', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#6C757D', marginTop: 5 },
  card: { 
    backgroundColor: 'white', 
    width: '100%', 
    maxWidth: 400, 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  cardHeader: { fontSize: 22, fontWeight: '700', color: '#1A1A1B' },
  cardSub: { fontSize: 14, color: '#ADB5BD', marginBottom: 25, marginTop: 5 },
  googleButton: { 
    flexDirection: 'row', 
    backgroundColor: '#4361EE', 
    width: '100%', 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 40, color: '#ADB5BD', fontSize: 12 }
});