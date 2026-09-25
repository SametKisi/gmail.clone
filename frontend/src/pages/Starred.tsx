import { useEffect, useRef, useMemo } from 'react';
import { SquareIcon, CaretDownIcon, CheckSquareIcon, TrashIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import { useOutletContext } from 'react-router-dom';
import { useMailPagination } from '../hooks/useMailPagination';
import type { Mail } from '../hooks/useMailPagination';
import { MailSkeleton, MailItem } from '../components/MailComponents';
import axios from '../../src/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { WindowVirtualizedList } from 'virtua-restoration';
import { useVirtualListStore } from '../stores/useVirtualListStore';
import type { CacheSnapshot } from 'virtua';
import type { ShowDeleteToastFn } from './Layout';

const API_EMAILS_URL = '/emails';
const API_POSTED_URL = '/posted';
const API_STARRED_URL = '/starred';

const StarredMails = () => {
  const observerTarget = useRef(null);

  const { showDeleteToast } = useOutletContext<{ showDeleteToast: ShowDeleteToastFn }>();

  const {
    mails, selectedMails, isLoading, isFetchingMore, totalMails, isAllSelected, hasMore,
    fetchMails, handleLoadMore, selectAll, toggleSelection, clearSelection,
    toggleMailStarInState, deleteMailsFromState, restoreMailsInState
  } = useMailPagination(API_STARRED_URL, 40);

  const currentCacheKey = 'mail-list-starred';

  const cacheProvider = useMemo(() => ({
    get: () => useVirtualListStore.getState().get(currentCacheKey),
    set: (data: [number, CacheSnapshot]) => useVirtualListStore.getState().set(currentCacheKey, data)
  }), [currentCacheKey]);

  const getMailUrl = (mail: Mail) => {
    const isPostedMail = !!mail.to || mail.folder === 'sent';
    return isPostedMail ? API_POSTED_URL : API_EMAILS_URL;
  };


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading && mails.length < totalMails) {
          handleLoadMore();
        }
      },
      { rootMargin: "400px" }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, isFetchingMore, isLoading, mails.length, totalMails, handleLoadMore]);

  useEffect(() => { 
    if (mails.length === 0) {
      fetchMails(); 
    }
  }, [mails.length,fetchMails]);

  useEffect(() => {
    if (!isLoading && !isFetchingMore && mails.length === 0 && totalMails > 0) {
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  }, [mails.length, totalMails, isLoading, isFetchingMore, fetchMails]);

  const handleUnstarMail = async (id: string | number) => {
    const mail = mails.find(m => String(m.id) === String(id));
    if (!mail) return;

    const targetUrl = getMailUrl(mail);

    toggleMailStarInState(id);
    try {
      await axios.patch(`${targetUrl}/${id}`, { isStarred: false });
    } catch {
      toggleMailStarInState(id);
      toast.error("İşlem başarısız!");
    }
  };

  const handleDeleteMail = async (id: string | number) => {
    const mailToDelete = mails.find(m => String(m.id) === String(id));
    if (!mailToDelete) return;

    const targetUrl = getMailUrl(mailToDelete);

    deleteMailsFromState(id);
    try {
      showDeleteToast(id, { [id]: targetUrl }, (ids) => restoreMailsInState(ids[0]));
      await axios.patch(`${targetUrl}/${id}`, { isDel: true });
    } catch {
      restoreMailsInState(id);
      toast.error("Silinemedi!");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMails.length === 0) return;
    const ids = [...selectedMails];

    const deletedMails = mails.filter(m => ids.includes(m.id));
    const urlMap = Object.fromEntries(deletedMails.map((m) => [m.id, getMailUrl(m)]));

    deleteMailsFromState(ids);
    clearSelection();

    try {
      showDeleteToast(ids, urlMap, (restoredIds) => restoreMailsInState(restoredIds));
      await Promise.all(
        ids.map((id) => axios.patch(`${urlMap[id] ?? API_EMAILS_URL}/${id}`, { isDel: true }))
      );
    } catch {
      restoreMailsInState(ids);
      toast.error("İşlem başarısız!");
    }
  };

  return (
    <div className='flex-col text-foreground'>
      <Toaster position="bottom-left" reverseOrder={false} />
      
      <div className='flex items-center'>
        {isAllSelected ? (
          <CheckSquareIcon 
            onClick={selectAll} 
            className='select-none size-5 ml-7 mt-2 p-1 text-primary cursor-pointer rounded-full hover:bg-muted shrink-0 box-content' 
          />
        ) : (
          <SquareIcon 
            onClick={selectAll} 
            className='select-none size-5 ml-7 mt-2 text-foreground p-1 box-content cursor-pointer rounded-full hover:bg-muted shrink-0' 
          />
        )}
        
        <CaretDownIcon className='size-4 text-foreground p-1 flex items-center box-content cursor-pointer rounded-full hover:bg-muted mt-1'/>
        
        <TrashIcon 
          onClick={handleBulkDelete} 
          className={`select-none size-5 ml-5 mt-1 p-2 box-content cursor-pointer rounded-full hover:bg-muted ${
            selectedMails.length > 0 ? 'text-red-500' : 'text-muted-foreground'
          }`} 
        />
      </div>

      <h2 className="text-xl justify-items-end mb-2 text-center font-medium text-foreground ">Yıldızlanmış Mailler</h2>

      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => <MailSkeleton key={index} />)
      ) : mails.length > 0 ? (
        <>
          <WindowVirtualizedList 
            cacheKey={currentCacheKey}
            customProvider={cacheProvider}
            cacheSourceType="custom"
          >
            {mails.map((mail) => (
              <MailItem 
                key={mail.id} 
                mail={mail} 
                isSelected={selectedMails.includes(mail.id)}
                onToggleSelect={toggleSelection}
                onDelete={handleDeleteMail}
                onToggleStar={() => handleUnstarMail(mail.id)}
                onRestore={undefined}
              />
            ))}
          </WindowVirtualizedList>

          {hasMore && mails.length < totalMails && (
            <div ref={observerTarget} className='flex justify-center mt-4 mb-6 h-10'>
              {isFetchingMore && <ArrowClockwiseIcon className='size-7 p-2 text-muted-foreground box-content rounded-full animate-spin' />}
            </div>
          )}
        </>
      ) : (
        <div className="text-lg p-1 text-center font-medium text-muted-foreground mt-5">
          Yıldızlı mesaj yok
        </div>
      )}
    </div>
  );
};

export default StarredMails;