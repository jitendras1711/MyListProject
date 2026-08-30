import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { getToken, removeToken } from './storage';
import { refreshAuthToken } from './auth';

type ApiRequestOptions = RequestInit & {
  suppressErrorAlert?: boolean;
};

const LOCAL_BASE_URL = 'http://localhost:5024';
const ANDROID_EMULATOR_BASE_URL = 'http://10.0.2.2:5024';
const PROD_BASE_URL = 'https://atomizeapi-crbzbkfqbjftf6a8.canadacentral-01.azurewebsites.net';
const isDev = process.env.NODE_ENV !== 'production';

const envBaseUrl =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '')
    : undefined;

const isWebLocalhost = typeof window !== 'undefined'
  ? window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1'
  : false;

const BASE_URL = envBaseUrl
  || (Platform.OS === 'web' && isWebLocalhost ? LOCAL_BASE_URL : PROD_BASE_URL)
  || ANDROID_EMULATOR_BASE_URL;

const buildHeaders = (token?: string | null, extraHeaders: HeadersInit = {}) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extraHeaders,
});

export const apiRequest = async (endpoint: string, options: ApiRequestOptions = {}) => {
  const { suppressErrorAlert = false, ...fetchOptions } = options;
  const initialToken = await getToken('userToken');

  const executeRequest = async (token?: string | null) => {
    return fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: buildHeaders(token, fetchOptions.headers ?? {}),
    });
  };

  let response: Response;
  try {
    response = await executeRequest(initialToken);
  } catch (error) {
    if (isDev) {
      console.error(`Request ${endpoint} failed before receiving a response:`, error);
    }

    if (!suppressErrorAlert) {
      Alert.alert('Connection problem', 'Please check your internet connection and try again.');
    }

    const err = new Error('Connection problem. Please try again.') as any;
    err.status = 0;
    throw err;
  }

  if (response.status === 401 && initialToken) {
    const refreshedToken = await refreshAuthToken();
    if (refreshedToken) {
      response = await executeRequest(refreshedToken);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      await removeToken('userToken');
      router.replace('/login');
      const err = new Error('Unauthorized. Redirecting to login.') as any;
      err.status = response.status;
      throw err;
    }

    let details = '';
    try {
      details = await response.text();
    } catch {
      /* ignore */
    }

    const devDetails = `Request ${endpoint} failed (${response.status} ${response.statusText})` +
      (details ? `\n${details}` : '');
    if (isDev) {
      console.error(devDetails);
    }

    const msg = 'Something went wrong. Please try again.';
    if (!suppressErrorAlert) {
      Alert.alert('Request failed', msg);
    }

    const err = new Error(msg) as any;
    err.status = response.status;
    throw err;
  }

  return response;
};

export const api = {
  get: (endpoint: string) => apiRequest(endpoint).then(r => r.json()),
  post: (endpoint: string, data?: any) => apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }).then(r => r.json()),
  put: (endpoint: string, data?: any) => apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }).then(r => r.json()),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }).then(r => r.json()),
};
