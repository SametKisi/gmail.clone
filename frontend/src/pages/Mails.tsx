import { useEffect, useState, useRef, useMemo } from 'react';
import { SquareIcon, CaretDownIcon, CheckSquareIcon, TrashIcon, ArrowClockwiseIcon, TrayIcon } from '@phosphor-icons/react';
import { useParams, useSearchParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useMailPagination } from '../hooks/useMailPagination';
import type { Mail } from '../hooks/useMailPagination';
import { MailSkeleton, MailItem } from '../components/MailComponents';
import axios from '../../src/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import { WindowVirtualizedList } from 'virtua-restoration';
import { useVirtualListStore } from '../stores/useVirtualListStore';
import type { CacheSnapshot } from 'virtua';
import type { ShowDeleteToastFn } from './Layout';

const API_URL = '/emails';

const Mails = () => {
  const chipStyle = "inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-border rounded-lg text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors shrink-0 gmail-font";

  const { showDeleteToast } = useOutletContext<{ showDeleteToast: ShowDeleteToastFn }>();

  const { id } = useParams();
  const [searchResults, setSearchResults] = useState<Mail[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const arananKelime = searchParams.get('search');
  const debouncedSearchTerm = useDebounce(arananKelime, 500);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const lastHandledRefresh = useRef<number | null>(null);

  const getMailUrl = (mail: Mail) => {
    const isPostedMail = !!mail.to || mail.folder === 'sent';
    return isPostedMail ? '/posted' : API_URL;
  };

  const {
    mails, selectedMails, isLoading, isFetchingMore, totalMails, isAllSelected, hasMore,
    fetchMails, handleLoadMore, selectAll, toggleSelection, clearSelection,
    toggleMailStarInState, deleteMailsFromState, restoreMailsInState,
  } = useMailPagination(API_URL, 40);

  const isSearchMode = searchResults !== null;
  const displayMails = isSearchMode ? searchResults : mails;

  const isAllSelectedDisplay = isSearchMode
    ? displayMails.length > 0 && displayMails.every((m) => selectedMails.includes(m.id))
    : isAllSelected;

  const currentCacheKey = isSearchMode ? 'mail-list-search' : `mail-list-${id || 'inbox'}`;

  const cacheProvider = useMemo(() => ({
    get: () => {
      return useVirtualListStore.getState().get(currentCacheKey);
    },
    set: (data: [number, CacheSnapshot]) => {
      useVirtualListStore.getState().set(currentCacheKey, data);
    }
  }), [currentCacheKey]);

  const handleSelectAll = () => {
    if (isSearchMode) {
      if (isAllSelectedDisplay) {
        clearSelection();
      } else {
        displayMails.forEach((m) => {
          if (!selectedMails.includes(m.id)) toggleSelection(m.id);
        });
      }
    } else {
      selectAll();
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      await Promise.resolve();
      
      if (!debouncedSearchTerm || !debouncedSearchTerm.trim()) {
        setSearchResults(null);
        return;
      }
      
      setIsSearching(true);
      try {
        const response = await axios.get(`/search?q=${encodeURIComponent(debouncedSearchTerm.trim())}`) as { mails?: Mail[]; data?: { mails?: Mail[] }; [key: string]: unknown };
        const results = response?.mails || response?.data?.mails || response?.data || response || [];
        setSearchResults(Array.isArray(results) ? (results as Mail[]) : []);
      } catch (err) {
        console.error("Arama hatası:", err);
        toast.error("Arama yapılamadı", { position: 'top-center' });
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (mails.length === 0) {
      fetchMails(1, false).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  }, [fetchMails, mails.length]);

  useEffect(() => {
    if (!isLoading && !isFetchingMore && mails.length === 0 && totalMails > 0) {
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
      
    }
  }, [mails.length, totalMails, isLoading, isFetchingMore, fetchMails]);





  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading && mails.length < totalMails && searchResults === null) {
          handleLoadMore();
        }
      },
      { rootMargin: "100px" }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, isFetchingMore, isLoading, mails.length, totalMails, handleLoadMore, searchResults]);

  useEffect(() => {
    const state = location.state as { forceRefresh?: number } | null;
    if (state?.forceRefresh && state.forceRefresh !== lastHandledRefresh.current) {
      lastHandledRefresh.current = state.forceRefresh;
      useVirtualListStore.getState().resetCache(currentCacheKey);
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });


      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, currentCacheKey, fetchMails, navigate]);

  const handleDeleteMail = async (mailId: string | number) => {
    const mail = displayMails.find((m) => m.id === mailId);
    const targetUrl = mail ? getMailUrl(mail) : API_URL;

    if (isSearchMode) {
      setSearchResults((prev) => (prev ? prev.filter((m) => m.id !== mailId) : prev));
    }
    deleteMailsFromState(mailId);

    try {
      showDeleteToast(mailId, { [mailId]: targetUrl }, (ids) => {
        if (isSearchMode && mail) {
          setSearchResults((prev) => (prev ? [...prev, mail] : prev));
        }
        restoreMailsInState(ids[0]);
      });
      await axios.patch(`${targetUrl}/${mailId}`, { isDel: true });
    } catch {
      if (!isSearchMode) restoreMailsInState(mailId);
      toast.error("Silme işlemi başarısız oldu!", { position: 'bottom-left' });
    }
  };
  

  const handleBulkDelete = async () => {
    if (selectedMails.length === 0) return;
    const ids = [...selectedMails];

    const deletedMails = displayMails.filter((m) => ids.includes(m.id));
    const urlMap = Object.fromEntries(deletedMails.map((m) => [m.id, getMailUrl(m)]));

    if (isSearchMode) {
      setSearchResults((prev) => (prev ? prev.filter((m) => !ids.includes(m.id)) : prev));
    }
    deleteMailsFromState(ids);

    clearSelection();
    try {
      showDeleteToast(ids, urlMap, (restoredIds) => {
        if (isSearchMode) {
          setSearchResults((prev) => (prev ? [...prev, ...deletedMails.filter(m => restoredIds.includes(m.id))] : prev));
        }
        restoreMailsInState(restoredIds);
      });
      await Promise.all(
        ids.map((mailId) => axios.patch(`${urlMap[mailId] ?? API_URL}/${mailId}`, { isDel: true }))
      );
    } catch {
      toast.error("İşlem başarısız!", { position: 'bottom-left' });
      if (!isSearchMode) restoreMailsInState(ids);
    }
  };

  const handleToggleStar = async (mailId: string | number, currentStarred?: boolean) => {
    if (isSearchMode) {
      setSearchResults((prev) =>
        prev ? prev.map((m) => (m.id === mailId ? { ...m, isStarred: !currentStarred } : m)) : prev
      );
    } else {
      toggleMailStarInState(mailId);
    }
    try {
      await axios.patch(`${API_URL}/${mailId}`, { isStarred: !currentStarred });
    } catch {
      if (isSearchMode) {
        setSearchResults((prev) =>
          prev ? prev.map((m) => (m.id === mailId ? { ...m, isStarred: currentStarred } : m)) : prev
        );
      } else {
        toggleMailStarInState(mailId);
      }
      toast.error("Yıldız güncellenemedi");
    }
  };

  return (
    <div className='w-full min-h-screen flex-col text-foreground'>
      <Toaster position="bottom-left" />

      <div className='flex items-center'>
        {isAllSelectedDisplay ? (
          <CheckSquareIcon onClick={handleSelectAll} className='select-none text-primary size-5 ml-7 mt-2 p-1 cursor-pointer rounded-full hover:bg-muted shrink-0 box-content' />
        ) : (
          <SquareIcon onClick={handleSelectAll} className='select-none text-foreground size-5 ml-7 mt-2 p-1 box-content cursor-pointer rounded-full hover:bg-muted shrink-0' />
        )}
        <CaretDownIcon className='size-4 p-1 flex items-center text-foreground box-content cursor-pointer rounded-full hover:bg-muted mt-1' />
        <TrashIcon
          onClick={handleBulkDelete}
          className={`select-none size-5 ml-5 mt-1 p-2 box-content cursor-pointer rounded-full hover:bg-muted ${selectedMails.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
        />
      </div>

      {isSearchMode ?
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto no-scrollbar">
          <div className={chipStyle}><span className='text-foreground'>Kimden</span><CaretDownIcon className="size-3.5 text-muted-foreground ml-0.5" weight="bold" /></div>
          <div className={chipStyle}><span className='text-foreground'>Herhangi bir zaman</span><CaretDownIcon className="size-3.5 text-muted-foreground ml-0.5" weight="bold" /></div>
          <div className={chipStyle}><span className='text-foreground'>Eki olan</span></div>
          <div className={chipStyle}><span className='text-foreground'>Kime</span><CaretDownIcon className="size-3.5 text-muted-foreground ml-0.5" weight="bold" /></div>
          <div className={chipStyle}><span className='text-foreground'>Tanıtımlar'ı hariç tut</span></div>
          <div className={chipStyle}><span className='text-foreground'>Okunmamış</span></div>
          <button className="text-primary hover:bg-muted px-2 py-1 rounded-3xl text-sm font-medium ml-2 shrink-0 cursor-pointer">
            Gelişmiş arama
          </button>
        </div>
        :
        <div className="relative flex items-center gap-4 px-8 h-14 max-w-40 hover:bg-muted text-primary cursor-pointer transition-colors">
          <TrayIcon className="size-5 box-content shrink-0" />
          <span className="text-[13px] font-stretch-110% rounded-2xl tracking-wide select-none">Birincil</span>
          <div className="absolute bottom-0 left-0 h-1 w-full px-2">
            <div className="h-full w-full bg-primary rounded-t-md"></div>
          </div>
        </div>
      }

      {isLoading || isSearching ? (
        Array.from({ length: 5 }).map((_, index) => <MailSkeleton key={index} />)
      ) : displayMails.length === 0 ? (
        <div className='text-lg text-center mt-5 text-muted-foreground'>
          {isSearchMode ? "Arama kriterlerinize uygun mail bulunamadı." : "Gelen Mail Yok"}
        </div>
      ) : (
        <>
          {mails.length === 0 && !isSearchMode && (
            <div className="flex justify-center p-6 mt-5">
              <ArrowClockwiseIcon className="size-8 text-muted-foreground animate-spin" />
            </div>
          )}

          <WindowVirtualizedList
            cacheKey={currentCacheKey}
            customProvider={cacheProvider}
            cacheSourceType="custom"
          >
            {displayMails.map((mail) => (
              <MailItem
                key={mail.id}
                mail={mail}
                isSelected={selectedMails.includes(mail.id)}
                onToggleSelect={toggleSelection}
                onDelete={handleDeleteMail}
                onToggleStar={() => handleToggleStar(mail.id, mail.isStarred)}
                onRestore={undefined}
              />
            ))}
          </WindowVirtualizedList>

          {!id && !isSearchMode && hasMore && mails.length < totalMails && (
            <div className='flex justify-center mt-4 mb-6 h-10 w-full'>
              {isFetchingMore ? (
                <ArrowClockwiseIcon className='size-7 p-2 text-muted-foreground rounded-full animate-spin' />
              ) : (
                <div ref={observerTarget} className="w-full h-full" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Mails;