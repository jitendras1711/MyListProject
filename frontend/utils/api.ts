import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { getToken, removeToken } from './storage';
import { refreshAuthToken } from './auth';

const LOCAL_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5024' : 'http://localhost:5024';
const PROD_BASE_URL = 'https://atomizeapi-crbzbkfqbjftf6a8.canadacentral-01.azurewebsites.net';

const isLocalDev = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : Platform.OS !== 'web';

const BASE_URL = isLocalDev ? LOCAL_BASE_URL : PROD_BASE_URL;

const buildHeaders = (token?: string | null, extraHeaders: HeadersInit = {}) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extraHeaders,
});

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const initialToken = await getToken('userToken');

  const executeRequest = async (token?: string | null) => {
    return fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: buildHeaders(token, options.headers ?? {}),
    });
  };

  let response = await executeRequest(initialToken);

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

    const msg = `Request ${endpoint} failed (${response.status} ${response.statusText})` +
      (details ? `\n${details}` : '');
    Alert.alert('Network Error', msg);

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