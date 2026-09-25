
export const isTrashKey = (key: string) => key.includes('trash');
export const isStarredKey = (key: string) => key.includes('starred');
export const isPostedKey = (key: string) => key.includes('posted');
export const isInboxKey = (key: string) =>
    !isStarredKey(key) && !isTrashKey(key) && !isPostedKey(key);

export const findTrashKey = (keys: string[]) => keys.find(isTrashKey);
export const findStarredKey = (keys: string[]) => keys.find(isStarredKey);
export const findPostedKey = (keys: string[]) => keys.find(isPostedKey);
export const findInboxKey = (keys: string[]) => keys.find(isInboxKey);

export const DEFAULT_TRASH_URL = '/trash';