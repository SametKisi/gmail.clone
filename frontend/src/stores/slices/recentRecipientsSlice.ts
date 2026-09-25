import type { StateCreator } from 'zustand';
import type { MailStoreState } from '../../types/mail';

export interface RecentRecipient {
    email: string;
    lastUsedAt: number;
    useCount: number;
}

export interface RecentRecipientsSlice {
    recentRecipients: RecentRecipient[];
    addRecentRecipient: (email: string) => void;
    getRecipientSuggestions: (query: string) => RecentRecipient[];
    removeRecentRecipient: (email: string) => void;
}

export const createRecentRecipientsSlice: StateCreator<MailStoreState, [], [], RecentRecipientsSlice> = (set, get) => ({
    recentRecipients: [],

    addRecentRecipient: (rawEmail) => {
        console.log("addRecentRecipient ÇAĞRILDI:", rawEmail);
        const email = rawEmail.trim().toLowerCase();
        if (!email) {
            console.log("addRecentRecipient: email boş, çıkılıyor");
            return;
        }

        set((state) => {
            const existing = state.recentRecipients.find((r) => r.email === email);
            if (existing) {
                return {
                    recentRecipients: state.recentRecipients.map((r) =>
                        r.email === email
                            ? { ...r, lastUsedAt: Date.now(), useCount: r.useCount + 1 }
                            : r
                    ),
                };
            }
            return {
                recentRecipients: [
                    ...state.recentRecipients,
                    { email, lastUsedAt: Date.now(), useCount: 1 },
                ],
            };
        });

        console.log("addRecentRecipient SONRASI state:", get().recentRecipients);
    },

    getRecipientSuggestions: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        return get()
            .recentRecipients.filter((r) => {
                if (q.includes('@')) {
                    return r.email.startsWith(q);
                }
                const localPart = r.email.split('@')[0];
                return localPart.includes(q);
            })
            .sort((a, b) => b.useCount - a.useCount || b.lastUsedAt - a.lastUsedAt)
            .slice(0, 5);
    },

    removeRecentRecipient: (email) => set((state) => ({
        recentRecipients: state.recentRecipients.filter((r) => r.email !== email),
    })),
});