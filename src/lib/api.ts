import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TIMEOUT_MS = 8000;
const DEFAULT_API_PORT = '8001';

class ApiRequestError extends Error {
  code: 'api_config' | 'network' | 'timeout' | 'http';
  url?: string;

  constructor(
    code: 'api_config' | 'network' | 'timeout' | 'http',
    message: string,
    options?: { url?: string }
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.url = options?.url;
  }
}

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

function normalizeBaseUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/$/, '');

  try {
    const parsedUrl = new URL(trimmedValue);

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    throw new ApiRequestError(
      'api_config',
      `EXPO_PUBLIC_API_URL inválida: ${trimmedValue}. Exemplo esperado: http://192.168.x.x:${DEFAULT_API_PORT}/api`
    );
  }
}

function resolveBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    const normalizedConfiguredUrl = normalizeBaseUrl(configuredUrl);

    if (Platform.OS === 'android' && configuredUrl.includes('localhost')) {
      return normalizedConfiguredUrl.replace('localhost', '10.0.2.2');
    }

    return normalizedConfiguredUrl;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_API_PORT}/api`;
  }

  const devServerHost = getDevServerHost();

  if (devServerHost) {
    return `http://${devServerHost}:${DEFAULT_API_PORT}/api`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
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
      throw new ApiRequestError(
        'http',
        `API error ${response.status}: ${response.statusText || 'Unexpected response'}`,
        { url }
      );
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
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError(
        'timeout',
        `Tempo esgotado ao acessar ${url}. Confira se o backend está ativo.`,
        { url }
      );
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        'network',
        `Não foi possível conectar em ${url}. Verifique o EXPO_PUBLIC_API_URL, o backend e a rede do dispositivo.`,
        { url }
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

export { ApiRequestError, BASE_URL };
