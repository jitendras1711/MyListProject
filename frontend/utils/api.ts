import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { getToken, removeToken } from './storage';
import { refreshAuthToken } from './auth';

type ApiRequestOptions = RequestInit & {
  suppressErrorAlert?: boolean;
};

type DemoItem = {
  id: number;
  title: string;
  isCompleted: boolean;
  parentId: number | null;
  userId: string;
  sharedCount: number;
  isOwnedByCurrentUser: boolean;
  isSharedWithMe: boolean;
  createdByName: string;
};

const demoItems: DemoItem[] = [
  {
    id: 1,
    title: 'Plan my week',
    isCompleted: false,
    parentId: null,
    userId: 'demo-user',
    sharedCount: 0,
    isOwnedByCurrentUser: true,
    isSharedWithMe: false,
    createdByName: 'Demo User',
  },
  {
    id: 2,
    title: 'Review today\'s priorities',
    isCompleted: false,
    parentId: 1,
    userId: 'demo-user',
    sharedCount: 0,
    isOwnedByCurrentUser: true,
    isSharedWithMe: false,
    createdByName: 'Demo User',
  },
  {
    id: 3,
    title: 'Welcome to Atomize',
    isCompleted: true,
    parentId: null,
    userId: 'demo-user',
    sharedCount: 0,
    isOwnedByCurrentUser: true,
    isSharedWithMe: false,
    createdByName: 'Demo User',
  },
];

const demoFriends = [
  { id: 'demo-friend-1', email: 'friend@example.com', name: 'Demo Friend' },
];

const demoResponse = (body: unknown, status = 200) => new Response(
  body === undefined ? null : JSON.stringify(body),
  { status, headers: { 'Content-Type': 'application/json' } },
);

const parseBody = (body: BodyInit | null | undefined) => {
  if (typeof body !== 'string') return {} as Record<string, unknown>;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
};

const demoRequest = async (endpoint: string, options: RequestInit): Promise<Response> => {
  const url = new URL(endpoint, 'https://demo.atomize.local');
  const method = (options.method ?? 'GET').toUpperCase();
  const body = parseBody(options.body);
  const path = url.pathname;

  if (path === '/items' && method === 'GET') {
    const parentId = url.searchParams.get('parentId');
    return demoResponse(demoItems.filter(item =>
      parentId === null ? item.parentId === null : item.parentId === Number(parentId),
    ));
  }

  if (path === '/items' && method === 'POST') {
    const item: DemoItem = {
      id: Math.max(...demoItems.map(existing => existing.id), 0) + 1,
      title: String(body.title ?? 'New task'),
      isCompleted: false,
      parentId: body.parentId == null ? null : Number(body.parentId),
      userId: 'demo-user',
      sharedCount: 0,
      isOwnedByCurrentUser: true,
      isSharedWithMe: false,
      createdByName: 'Demo User',
    };
    demoItems.push(item);
    return demoResponse(item, 201);
  }

  const itemMatch = path.match(/^\/items\/(\d+)(?:\/(toggle|shared-users|share))?$/);
  if (itemMatch) {
    const item = demoItems.find(existing => existing.id === Number(itemMatch[1]));
    const action = itemMatch[2];
    if (action === 'shared-users' && method === 'GET') return demoResponse([]);
    if (action === 'share' && method === 'POST') return demoResponse({ message: 'Shared successfully' });
    if (!item) return demoResponse({ message: 'Item not found' }, 404);
    if (action === 'toggle' && method === 'PUT') {
      item.isCompleted = !item.isCompleted;
      return demoResponse(item);
    }
    if (!action && method === 'PUT') {
      item.title = String(body.title ?? item.title);
      return demoResponse(item);
    }
    if (!action && method === 'DELETE') {
      const idsToDelete = new Set([item.id]);
      let changed = true;
      while (changed) {
        changed = false;
        demoItems.forEach(candidate => {
          if (candidate.parentId !== null && idsToDelete.has(candidate.parentId) && !idsToDelete.has(candidate.id)) {
            idsToDelete.add(candidate.id);
            changed = true;
          }
        });
      }
      for (let index = demoItems.length - 1; index >= 0; index -= 1) {
        if (idsToDelete.has(demoItems[index].id)) demoItems.splice(index, 1);
      }
      return demoResponse(undefined, 204);
    }
  }

  if (path === '/friends' && method === 'GET') return demoResponse(demoFriends);
  if (path === '/friends' && method === 'POST') {
    const email = String(body.friendEmail ?? '').trim().toLowerCase();
    if (email && !demoFriends.some(friend => friend.email === email)) {
      demoFriends.push({ id: `demo-${Date.now()}`, email, name: 'Demo Friend' });
    }
    return demoResponse({ message: 'Friend added successfully' });
  }
  if (path.startsWith('/friends/') && method === 'DELETE') {
    const email = decodeURIComponent(path.slice('/friends/'.length));
    const index = demoFriends.findIndex(friend => friend.email === email);
    if (index >= 0) demoFriends.splice(index, 1);
    return demoResponse(undefined, 204);
  }
  if (path === '/users/search' && method === 'GET') {
    const query = (url.searchParams.get('q') ?? '').toLowerCase();
    return demoResponse(query ? [
      { id: 'demo-search-user', email: 'reviewer@example.com', name: 'Demo Reviewer' },
    ] : []);
  }
  if (path === '/users/me' && method === 'DELETE') return demoResponse(undefined, 204);

  return demoResponse({ message: 'Demo mode does not support this action yet.' }, 400);
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

  if (initialToken?.startsWith('demo_')) {
    return demoRequest(endpoint, fetchOptions);
  }

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
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }).then(r =>
    r.status === 204 ? null : r.json(),
  ),
};
