import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MailStoreState } from '../types/mail';
import { createFolderCrudSlice } from './slices/folderCrudSlice';
import { createStarSlice } from './slices/starSlice';
import { createTrashSlice } from './slices/trashSlice';
import { createRecentRecipientsSlice } from './slices/recentRecipientsSlice.ts';

const useMailStore = create<MailStoreState>()(
    persist(
        (...a) => ({
            ...createFolderCrudSlice(...a),
            ...createStarSlice(...a),
            ...createTrashSlice(...a),
            ...createRecentRecipientsSlice(...a),
        }),
        {
            name: 'mail-store', 
            partialize: (state) => ({
                recentRecipients: state.recentRecipients,
            }) as MailStoreState,
        }
    )
);

export default useMailStore;

export type { Mail, FolderCache, MailStoreState } from '../types/mail';