import type { StateCreator } from 'zustand';
import type { Mail, FolderCache, MailStoreState } from '../../types/mail';
import { emptyFolder } from '../../types/mail';

export interface FolderCrudSlice {
    foldersCache: { [key: string]: FolderCache };
    getFolder: (key: string) => FolderCache;
    setFolderMails: (key: string, mails: Mail[], totalMails: number, page?: number) => void;
    appendFolderMails: (key: string, mails: Mail[], page: number) => void;
    addMailToFolder: (key: string, mail: Mail) => void;
    addMailsToFolder: (key: string, mails: Mail[]) => void;
    removeMailFromFolder: (key: string, ids: (string | number) | (string | number)[]) => void;
    resetFolders: () => void;
}

const getSortTime = (mail: Mail): number =>
    mail.receivedAt ? new Date(mail.receivedAt).getTime() : 0;

const sortByReceivedAtDesc = (mails: Mail[]): Mail[] =>
    [...mails].sort((a, b) => getSortTime(b) - getSortTime(a));

export const createFolderCrudSlice: StateCreator<MailStoreState, [], [], FolderCrudSlice> = (set, get) => ({
    foldersCache: {},

    getFolder: (key) => get().foldersCache[key] || emptyFolder,

    setFolderMails: (key, mails, totalMails, page = 1) => set((state) => ({
        foldersCache: {
            ...state.foldersCache,
            [key]: { mails: sortByReceivedAtDesc(mails), totalMails, page, initialized: true }
        }
    })),

    appendFolderMails: (key, newMails, page) => set((state) => {
        const current = state.foldersCache[key] || emptyFolder;
        const merged = sortByReceivedAtDesc([...current.mails, ...newMails]);
        return {
            foldersCache: {
                ...state.foldersCache,
                [key]: { ...current, mails: merged, page }
            }
        };
    }),

    addMailToFolder: (key, mail) => set((state) => {
        const current = state.foldersCache[key] || emptyFolder;
        const merged = sortByReceivedAtDesc([mail, ...current.mails]);
        return {
            foldersCache: {
                ...state.foldersCache,
                [key]: { ...current, mails: merged, totalMails: current.totalMails + 1 }
            }
        };
    }),

    addMailsToFolder: (key, mails) => set((state) => {
        if (mails.length === 0) return state;

        const current = state.foldersCache[key] || emptyFolder;

        const existingIds = new Set(current.mails.map((m) => String(m.id)));
        const newMails = mails.filter((m) => !existingIds.has(String(m.id)));

        if (newMails.length === 0) return state;

        const merged = sortByReceivedAtDesc([...newMails, ...current.mails]);

        return {
            foldersCache: {
                ...state.foldersCache,
                [key]: {
                    ...current,
                    mails: merged,
                    totalMails: current.totalMails + newMails.length,
                    initialized: true,
                },
            },
        };
    }),

    removeMailFromFolder: (key, ids) => set((state) => {
        const idList = Array.isArray(ids) ? ids.map(String) : [String(ids)];
        const current = state.foldersCache[key] || emptyFolder;
        return {
            foldersCache: {
                ...state.foldersCache,
                [key]: {
                    ...current,
                    mails: current.mails.filter((m) => !idList.includes(String(m.id))),
                    totalMails: Math.max(0, current.totalMails - idList.length)
                }
            }
        };
    }),

    // Logout sırasında çağrılır: tüm klasör cache'lerini sıfırlar ki
    // bir sonraki (farklı hesapla) login'de fetchMails "initialized"
    // kontrolüne takılıp eski hesabın verisini göstermeye devam etmesin.
    resetFolders: () => set({ foldersCache: {} }),
});