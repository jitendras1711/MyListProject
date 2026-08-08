import { AuthRequest, makeRedirectUri, Prompt } from 'expo-auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { removeToken, saveToken } from './storage';

const WEB_CLIENT_ID = '192788138454-6cvomopeu4lg6ppvbm288bqcrejgcibe.apps.googleusercontent.com';
const WEB_SCOPES = ['openid', 'profile', 'email'];
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const refreshAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    // Silent refresh on the web is not reliable for the current Google id_token flow.
    // If the token is expired, treat the user as logged out rather than attempting
    // an interactive refresh that can show a Google popup.
    console.warn('Web token refresh disabled; returning null to force relogin.');
    await removeToken('userToken');
    return null;
  }

  try {
    const result = await GoogleSignin.signInSilently();
    const token = result?.data?.idToken;
    if (token) {
      await saveToken('userToken', token);
      return token;
    }
  } catch (error) {
    console.warn('Silent native token refresh failed:', error);
  }

  return null;
};