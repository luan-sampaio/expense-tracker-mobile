import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TIMEOUT_MS = 8000;

function getDevServerHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.developer?.tool ??
    Constants.manifest?.hostUri;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0] ?? null;
}

function resolveBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    if (Platform.OS === 'android' && configuredUrl.includes('localhost')) {
      return configuredUrl.replace('localhost', '10.0.2.2').replace(/\/$/, '');
    }

    return configuredUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api';
  }

  const devServerHost = getDevServerHost();

  if (devServerHost) {
    return `http://${devServerHost}:8000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  return 'http://localhost:8000/api';
}

const BASE_URL = resolveBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms for ${url}`);
    }

    if (error instanceof TypeError) {
      throw new Error(
        `Network request failed for ${url}. Check EXPO_PUBLIC_API_URL, backend availability, and whether your device can reach the host machine.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
};
