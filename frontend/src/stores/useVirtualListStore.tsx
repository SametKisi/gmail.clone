import { create } from 'zustand';
import type { CacheSnapshot } from 'virtua';

interface VirtualListState {
    cacheMap: Record<string, [number, CacheSnapshot]>;
    get: (key: string) => [number, CacheSnapshot] | undefined;
    set: (key: string, data: [number, CacheSnapshot]) => void;
    resetCache: (key?: string) => void;
}

export const useVirtualListStore = create<VirtualListState>((set, get) => ({
    cacheMap: {},
    get: (key) => {
        return get().cacheMap[key];
    },
    set: (key, data) => {
        set((state) => ({
            cacheMap: {
                ...state.cacheMap,
                [key]: data,
            },
        }));
    },
    resetCache: (key) => {
        set((state) => {
            if (!key) {
                return { cacheMap: {} };
            }
            const newCacheMap = { ...state.cacheMap };
            delete newCacheMap[key];
            return { cacheMap: newCacheMap };
        });
    },
}));