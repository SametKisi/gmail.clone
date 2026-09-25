import { useState, useCallback, useRef } from 'react';
import axios from '../../src/lib/api';
import toast from 'react-hot-toast';
import useMailStore, { type Mail } from '../stores/globalStateMails';
export type { Mail };

export const useMailPagination = (apiUrl: string, limit: number = 32) => {
    const cacheKey = apiUrl;
    const folder = useMailStore((s) => s.getFolder(cacheKey));
    const setFolderMails = useMailStore((s) => s.setFolderMails);
    const appendFolderMails = useMailStore((s) => s.appendFolderMails);
    const addMailsToFolder = useMailStore((s) => s.addMailsToFolder);
    const removeMailFromFolder = useMailStore((s) => s.removeMailFromFolder);
    const toggleStarInFolder = useMailStore((s) => s.toggleStarInFolder);
    const deleteMailEverywhere = useMailStore((s) => s.deleteMailEverywhere);
    const restoreMailEverywhere = useMailStore((s) => s.restoreMailEverywhere);

    const [selectedMails, setSelectedMails] = useState<(string | number)[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(!folder.initialized);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const requestIdRef = useRef<{ [key: string]: number }>({});

    const fetchMails = useCallback(async (currentPage: number = 1, isLoadMore: boolean = false, force: boolean = false) => {

        if (!isLoadMore && !force && folder.initialized) {
            setIsLoading(false);
            return;
        }

        if (isLoadMore) setIsFetchingMore(true);
        else setIsLoading(true);

        const start = (currentPage - 1) * limit;
        const end = start + limit - 1;

        const myRequestId = (requestIdRef.current[cacheKey] || 0) + 1;
        requestIdRef.current[cacheKey] = myRequestId;

        try {
            const response = await axios.get(`${apiUrl}?start=${start}&end=${end}`) as { mails?: Mail[]; data?: Mail[]; totalMails?: number };

            if (requestIdRef.current[cacheKey] !== myRequestId) return;

            const fetched = response.mails || response.data || [];
            const total = response.totalMails ?? 0;

            if (isLoadMore) {
                if (fetched.length === 0) {
                    setHasMore(false);
                }
                appendFolderMails(cacheKey, fetched, currentPage);
            } else {
                setHasMore(fetched.length < total);
                setFolderMails(cacheKey, fetched, total, currentPage);
            }
        } catch (error) {
            if (requestIdRef.current[cacheKey] !== myRequestId) return;
            console.error("Veri çekilirken hata:", error);
            toast.error("Veriler alınamadı.");
        } finally {
            if (requestIdRef.current[cacheKey] === myRequestId) {
                setIsLoading(false);
                setIsFetchingMore(false);
            }
        }
    }, [apiUrl, limit, cacheKey, folder.initialized, appendFolderMails, setFolderMails]);

    const handleLoadMore = useCallback(() => {
        if (isFetchingMore || isLoading || !hasMore || folder.mails.length >= folder.totalMails) return;
        const nextPage = folder.page + 1;
        fetchMails(nextPage, true);
    }, [fetchMails, folder.page, folder.mails.length, folder.totalMails, isFetchingMore, isLoading, hasMore]);

    const isAllSelected = folder.mails.length > 0 && selectedMails.length === folder.mails.length;
    const selectAll = () => setSelectedMails(isAllSelected ? [] : folder.mails.map((m) => m.id));
    const toggleSelection = (id: string | number) =>
        setSelectedMails((prev) => prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]);

    return {
        mails: folder.mails,
        totalMails: folder.totalMails,
        selectedMails,
        isLoading,
        isFetchingMore,
        isAllSelected,
        hasMore,
        fetchMails,
        handleLoadMore,
        selectAll,
        toggleSelection,
        toggleMailStarInState: (id: string | number) => toggleStarInFolder(cacheKey, id),
        deleteMailsFromState: (ids: (string|number)|(string|number)[]) => deleteMailEverywhere(ids),
        restoreMailsInState: (ids: (string|number)|(string|number)[]) => restoreMailEverywhere(ids),
        clearSelection: () => setSelectedMails([]),
        removeMailsFromState: (ids: (string | number) | (string | number)[]) => removeMailFromFolder(cacheKey, ids),
        addMailsToState: (mails: Mail[]) => addMailsToFolder(cacheKey, mails), 
    };
};