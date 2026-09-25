import type { StateCreator } from 'zustand';
import type { Mail, FolderCache, MailStoreState } from '../../types/mail';
import { findStarredKey } from '../../utils/folderKeys';

export interface StarSlice {
    toggleStarInFolder: (_key: string, mailId: string | number) => void;
}

export const createStarSlice: StateCreator<MailStoreState, [], [], StarSlice> = (set) => ({
    toggleStarInFolder: (_key, mailId) => set((state) => {
        const targetId = String(mailId);
        const updatedFolders: { [key: string]: FolderCache } = {};
        let toggledMail: Mail | undefined;

        for (const [folderKey, folder] of Object.entries(state.foldersCache)) {
            const mail = folder.mails.find((m) => String(m.id) === targetId);
            if (mail) {
                toggledMail = { ...mail, isStarred: !mail.isStarred };
            }
            updatedFolders[folderKey] = {
                ...folder,
                mails: folder.mails.map((m) =>
                    String(m.id) === targetId ? { ...m, isStarred: !m.isStarred } : m
                ),
            };
        }

        if (!toggledMail) return { foldersCache: updatedFolders };

        const starredKey = findStarredKey(Object.keys(updatedFolders));
        if (starredKey) {
            const starredFolder = updatedFolders[starredKey];
            const existsInStarred = starredFolder.mails.some((m) => String(m.id) === targetId);

            if (toggledMail.isStarred && !existsInStarred) {
                updatedFolders[starredKey] = {
                    ...starredFolder,
                    mails: [toggledMail, ...starredFolder.mails],
                    totalMails: starredFolder.totalMails + 1,
                };
            } else if (!toggledMail.isStarred && existsInStarred) {
                updatedFolders[starredKey] = {
                    ...starredFolder,
                    mails: starredFolder.mails.filter((m) => String(m.id) !== targetId),
                    totalMails: Math.max(0, starredFolder.totalMails - 1),
                };
            }
        }

        return { foldersCache: updatedFolders };
    }),
});