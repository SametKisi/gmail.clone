import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { hasStatus } from '../types/errors';

type User = { id: string; email: string; name?: string };

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const cancelledRef = useRef(false);

    const fetchUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.get<User | null>('/me', { allowUnauthenticated: true });
            if (!cancelledRef.current) setUser(data);
        } catch (err) {
            const status = hasStatus(err) ? err.status : undefined;
            console.error('[useCurrentUser] /me başarısız:', status, err);
            if (!cancelledRef.current && status === 401) {
                navigate('/login');
            }
        } finally {
            if (!cancelledRef.current) setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        cancelledRef.current = false;
        //asenkron fonksiyon loading true yapma işlemi
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUser();
        return () => { cancelledRef.current = true; };
    }, [fetchUser]);

    return { user, isLoading, refetch: fetchUser };
}