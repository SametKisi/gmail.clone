import type { StateCreator } from 'zustand';
import type { Mail, FolderCache, MailStoreState } from '../../types/mail';
import {
    isTrashKey,
    findTrashKey,
    findInboxKey,
    findPostedKey,
    findStarredKey,
    DEFAULT_TRASH_URL,
} from '../../utils/folderKeys';

export interface TrashSlice {
    deleteMailEverywhere: (ids: (string | number) | (string | number)[]) => void;
    restoreMailEverywhere: (ids: (string | number) | (string | number)[]) => void;
}

const getSortTime = (mail: Mail): number =>
    mail.receivedAt ? new Date(mail.receivedAt).getTime() : 0;

const sortByReceivedAtDesc = (mails: Mail[]): Mail[] =>
    [...mails].sort((a, b) => getSortTime(b) - getSortTime(a));

const deletedPositions = new Map<string, { folderKey: string; index: number }[]>();

// Logout'ta çağrılır: modül seviyesindeki bu Map, store'un dışında
// yaşadığı için resetFolders() onu otomatik temizlemez.
export const clearDeletedPositions = () => deletedPositions.clear();

const insertAtIndex = (mails: Mail[], mail: Mail, index: number): Mail[] => {
    const clamped = Math.min(Math.max(index, 0), mails.length);
    const copy = [...mails];
    copy.splice(clamped, 0, mail);
    return copy;
};

export const createTrashSlice: StateCreator<MailStoreState, [], [], TrashSlice> = (set) => ({
    deleteMailEverywhere: (ids) => set((state) => {
        const idList = Array.isArray(ids) ? ids.map(String) : [String(ids)];
        const updatedFolders: { [key: string]: FolderCache } = {};
        const removedMails: Mail[] = [];

        for (const [key, folder] of Object.entries(state.foldersCache)) {
            if (isTrashKey(key)) {
                updatedFolders[key] = folder;
                continue;
            }

            const toRemove: Mail[] = [];
            folder.mails.forEach((m, index) => {
                const mailId = String(m.id);
                if (!idList.includes(mailId)) return;

                toRemove.push(m);

                if (!removedMails.some(rm => String(rm.id) === mailId)) {
                    removedMails.push(m);
                }

                const positions = deletedPositions.get(mailId) ?? [];
                positions.push({ folderKey: key, index });
                deletedPositions.set(mailId, positions);
            });

            updatedFolders[key] = {
                ...folder,
                mails: folder.mails.filter((m) => !idList.includes(String(m.id))),
                totalMails: Math.max(0, folder.totalMails - toRemove.length),
            };
        }

        let trashKey = findTrashKey(Object.keys(updatedFolders));
        if (!trashKey) {
            trashKey = DEFAULT_TRASH_URL;
            updatedFolders[trashKey] = { mails: [], totalMails: 0, page: 1, initialized: false };
        }

        if (removedMails.length > 0) {
            const trashFolder = updatedFolders[trashKey];
            const existingIds = new Set(trashFolder.mails.map((m) => String(m.id)));

            const trashedMails = removedMails
                .filter((m) => !existingIds.has(String(m.id)))
                .map((m) => ({ ...m, isDel: true }));

            updatedFolders[trashKey] = {
                ...trashFolder,
                mails: sortByReceivedAtDesc([...trashedMails, ...trashFolder.mails]),
                totalMails: trashFolder.totalMails + trashedMails.length,
                initialized: trashFolder.initialized,
            };
        }

        return { foldersCache: updatedFolders };
    }),

    restoreMailEverywhere: (ids) => set((state) => {
        const idList = Array.isArray(ids) ? ids.map(String) : [String(ids)];
        const updatedFolders: { [key: string]: FolderCache } = { ...state.foldersCache };
        let restoredMails: Mail[] = [];

        const trashKey = findTrashKey(Object.keys(updatedFolders));
        if (trashKey) {
            const trashFolder = updatedFolders[trashKey];
            restoredMails = trashFolder.mails.filter((m) => idList.includes(String(m.id)));
            updatedFolders[trashKey] = {
                ...trashFolder,
                mails: trashFolder.mails.filter((m) => !idList.includes(String(m.id))),
                totalMails: Math.max(0, trashFolder.totalMails - restoredMails.length),
            };
        }

        const inboxKey = findInboxKey(Object.keys(updatedFolders));
        const postedKey = findPostedKey(Object.keys(updatedFolders));
        const starredKey = findStarredKey(Object.keys(updatedFolders));

        restoredMails.forEach((mail) => {
            const restored = { ...mail, isDel: false };
            const mailId = String(mail.id);
            const positions = deletedPositions.get(mailId) ?? [];

            const isPostedMail = !!mail.to || mail.folder === 'sent';

            if (isPostedMail && postedKey) {
                const postedFolder = updatedFolders[postedKey];
                if (!postedFolder.mails.some((m) => String(m.id) === String(restored.id))) {
                    const pos = positions.find((p) => p.folderKey === postedKey);
                    const mails = pos
                        ? insertAtIndex(postedFolder.mails, restored, pos.index)
                        : sortByReceivedAtDesc([restored, ...postedFolder.mails]);
                    updatedFolders[postedKey] = {
                        ...postedFolder,
                        mails,
                        totalMails: postedFolder.totalMails + 1,
                    };
                }
            } else if (!isPostedMail && inboxKey) {
                const inboxFolder = updatedFolders[inboxKey];
                if (!inboxFolder.mails.some((m) => String(m.id) === String(restored.id))) {
                    const pos = positions.find((p) => p.folderKey === inboxKey);
                    const mails = pos
                        ? insertAtIndex(inboxFolder.mails, restored, pos.index)
                        : sortByReceivedAtDesc([restored, ...inboxFolder.mails]);
                    updatedFolders[inboxKey] = {
                        ...inboxFolder,
                        mails,
                        totalMails: inboxFolder.totalMails + 1,
                    };
                }
            }

            if (starredKey && restored.isStarred) {
                const starredFolder = updatedFolders[starredKey];
                if (!starredFolder.mails.some((m) => String(m.id) === String(restored.id))) {
                    const pos = positions.find((p) => p.folderKey === starredKey);
                    const mails = pos
                        ? insertAtIndex(starredFolder.mails, restored, pos.index)
                        : sortByReceivedAtDesc([restored, ...starredFolder.mails]);
                    updatedFolders[starredKey] = {
                        ...starredFolder,
                        mails,
                        totalMails: starredFolder.totalMails + 1,
                    };
                }
            }

            deletedPositions.delete(mailId);
        });

        return { foldersCache: updatedFolders };
    }),
});