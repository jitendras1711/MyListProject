import { AuthRequest, makeRedirectUri, Prompt } from 'expo-auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { saveToken } from './storage';

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
    try {
      const redirectUri = makeRedirectUri();
      const request = new AuthRequest({
        clientId: WEB_CLIENT_ID,
        redirectUri,
        responseType: 'id_token',
        scopes: WEB_SCOPES,
        prompt: Prompt.None,
        extraParams: {
          include_granted_scopes: 'true',
        },
      });

      const result = await request.promptAsync({ authorizationEndpoint: GOOGLE_AUTH_ENDPOINT });
      if (result.type === 'success') {
        const token = result.params?.id_token as string | undefined;
        if (token) {
          await saveToken('userToken', token);
          return token;
        }
      }
    } catch (error) {
      console.warn('Silent web token refresh failed:', error);
    }

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