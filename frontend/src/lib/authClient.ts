import { createAuthClient } from 'better-auth/react';

// Backend portunuz 3001 olduğu için:
const baseURL = "https://gmail-clone-r0iv.onrender.com";

export const TOKEN_KEY = 'bearer_token';
export const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearAuthToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const authClient = createAuthClient({
    baseURL,
    fetchOptions: {
        credentials: 'omit',
        auth: {
            type: 'Bearer',
            token: () => getAuthToken() ?? '',
        },
        onSuccess: (ctx) => {
            const token = ctx.response.headers.get('set-auth-token');
            if (token) sessionStorage.setItem(TOKEN_KEY, token);
        },
        onError: (ctx) => {
            console.error('[authClient] İstek hatası:', ctx.response?.status, ctx.error?.message);
        },
    },
});

export const { signIn, signUp, useSession } = authClient;