import { getAuthToken } from './authClient';
import { logoutManager } from '../utils/logoutManager';

// VITE_API_URL varsa onu kullanır, yoksa yerel '/api'ye düşer
const RAW_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = RAW_URL ? `${RAW_URL.replace(/\/$/, '')}/api` : '/api';

async function doFetch(method: string, url: string, body: unknown, extraHeaders?: Record<string, string>) {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extraHeaders,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE_URL}${url}`, {
        method,
        headers,
        credentials: 'include', // Oturum çerezleri ve kimlik doğrulama için gerekli
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

async function parseOrThrow(response: Response) {
    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw Object.assign(new Error(`İstek başarısız: ${response.status}`), {
            status: response.status,
            data: errorBody,
        });
    }
    if (response.status === 204) return undefined;
    return response.json();
}

export class ApiError extends Error {
    status?: number;
    code?: string;
    data?: unknown;

    constructor(message: string, opts: { status?: number; code?: string; data?: unknown } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = opts.status;
        this.code = opts.code;
        this.data = opts.data;
    }
}

async function request<T = unknown>(
    method: string,
    url: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
    options?: { allowUnauthenticated?: boolean }
): Promise<T> {
    let response: Response;
    try {
        response = await doFetch(method, url, body, extraHeaders);
    } catch {
        throw new ApiError('Sunucuya ulaşılamadı.', { code: 'NETWORK_ERROR' });
    }

    if (response.status === 401) {
        let errorData: { code?: string; hata?: string } | null = null;
        try {
            errorData = await response.clone().json();
        } catch { /* yoksay */ }

        if (options?.allowUnauthenticated && errorData?.code === 'NO_TOKEN') {
            return null as T;
        }

        if (errorData?.code === 'SESSION_INVALID') {
            console.error('[api] SESSION_INVALID - logout ediliyor:', url);
            await logoutManager.performLogout('session-invalid-on-server', errorData?.hata);
        }

        throw new ApiError(errorData?.hata || 'Oturum geçersiz.', {
            status: 401,
            code: errorData?.code,
        });
    }

    return parseOrThrow(response) as Promise<T>;
}

type RequestConfig = { headers?: Record<string, string>; allowUnauthenticated?: boolean };

const api = {
    get: <T = unknown>(url: string, config?: RequestConfig) =>
        request<T>('GET', url, undefined, config?.headers, { allowUnauthenticated: config?.allowUnauthenticated }),
    post: <T = unknown>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>('POST', url, body, config?.headers, { allowUnauthenticated: config?.allowUnauthenticated }),
    put: <T = unknown>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>('PUT', url, body, config?.headers, { allowUnauthenticated: config?.allowUnauthenticated }),
    patch: <T = unknown>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>('PATCH', url, body, config?.headers, { allowUnauthenticated: config?.allowUnauthenticated }),
    delete: <T = unknown>(url: string, config?: RequestConfig) =>
        request<T>('DELETE', url, undefined, config?.headers, { allowUnauthenticated: config?.allowUnauthenticated }),
};

export default api;