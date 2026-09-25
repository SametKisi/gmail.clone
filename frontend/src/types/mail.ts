export interface Mail {
    id: string | number;
    isDel?: boolean;
    isStarred?: boolean;
    [key: string]: unknown;
    receivedAt?: string | null;  
}

export interface FolderCache {
    mails: Mail[];
    totalMails: number;
    page: number;
    initialized: boolean;
}

export interface MailStoreState {
    foldersCache: { [key: string]: FolderCache };
    getFolder: (key: string) => FolderCache;
    setFolderMails: (key: string, mails: Mail[], totalMails: number, page?: number) => void;
    appendFolderMails: (key: string, mails: Mail[], page: number) => void;
    addMailToFolder: (key: string, mail: Mail) => void;
    addMailsToFolder: (key: string, mails: Mail[]) => void;
    removeMailFromFolder: (key: string, ids: (string | number) | (string | number)[]) => void;
    resetFolders: () => void;
    toggleStarInFolder: (_key: string, mailId: string | number) => void;
    deleteMailEverywhere: (ids: (string | number) | (string | number)[]) => void;
    restoreMailEverywhere: (ids: (string | number) | (string | number)[]) => void;
    recentRecipients: { email: string; lastUsedAt: number; useCount: number }[];
    addRecentRecipient: (email: string) => void;
    getRecipientSuggestions: (query: string) => { email: string; lastUsedAt: number; useCount: number }[];
    removeRecentRecipient: (email: string) => void;
}
export const emptyFolder: FolderCache = { mails: [], totalMails: 0, page: 1, initialized: false };