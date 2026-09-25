import { useEffect, useRef, useMemo } from 'react';
import { SquareIcon, CaretDownIcon, CheckSquareIcon, TrashIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import { useParams } from 'react-router-dom';
import { useMailPagination } from '../hooks/useMailPagination';
import { MailSkeleton, MailItem } from '../components/MailComponents';
import axios from '../../src/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { WindowVirtualizedList } from 'virtua-restoration';
import { useVirtualListStore } from '../stores/useVirtualListStore';
import type { CacheSnapshot } from 'virtua';

const API_POSTED_URL = "/posted";

const Sent = () => {
  const { id } = useParams();
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const {
    mails, selectedMails, isLoading, isFetchingMore, totalMails, isAllSelected, hasMore,
    fetchMails, handleLoadMore, selectAll, clearSelection, toggleSelection,
    deleteMailsFromState, toggleMailStarInState
  } = useMailPagination(API_POSTED_URL, 40);

  const currentCacheKey = 'mail-list-sent';

  const cacheProvider = useMemo(() => ({
    get: () => useVirtualListStore.getState().get(currentCacheKey),
    set: (data: [number, CacheSnapshot]) => useVirtualListStore.getState().set(currentCacheKey, data)
  }), [currentCacheKey]);

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
      fetchMails(1, false).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }

  }, [mails.length,fetchMails]);


  useEffect(() => {
    if (!isLoading && !isFetchingMore && mails.length === 0 && totalMails > 0) {
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  }, [mails.length, totalMails, isLoading, isFetchingMore, fetchMails]);

  const handleToggleStar = async (mailId: string | number, currentStarred: boolean) => {
    toggleMailStarInState(mailId);
    try {
      await axios.patch(`${API_POSTED_URL}/${mailId}`, { isStarred: !currentStarred });
    } catch {
      toggleMailStarInState(mailId);
      toast.error("Yıldız güncellenemedi");
    }
  };

  const handleDelete = async (mailId: string | number) => {
    deleteMailsFromState(mailId); 
    const deleteToastId = toast.loading("Çöp Kutusu'na taşınıyor...", { position: 'top-center' });
    try {
      await axios.patch(`${API_POSTED_URL}/${mailId}`, { isDel: true });
      setTimeout(() => toast.success("Post kaldırıldı", { id: deleteToastId, position: 'top-center', duration: 1000 }), 400);
    } catch {
      toast.error("Silinemedi!", { id: deleteToastId });
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    } 
  };

  const handleBulkDelete = async () => {
    if (selectedMails.length === 0) return;
    const ids = [...selectedMails];
    deleteMailsFromState(ids);
    clearSelection();
    
    const deleteToastId = toast.loading("Çöp Kutusu'na taşınıyor...", { position: 'top-center' });
    try {
      await Promise.all(ids.map(mailId => axios.patch(`${API_POSTED_URL}/${mailId}`, { isDel: true })));
      setTimeout(() => toast.success("Çöpe taşındı", { id: deleteToastId, position: 'top-center', duration: 1000 }), 400);
    } catch {
      toast.error("İşlem başarısız!", { id: deleteToastId });
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  };

  return (
    <div className='flex-col text-foreground'>
      <Toaster position="bottom-left" reverseOrder={false} />
      
      <div className='flex items-center'>
        {isAllSelected ? (
          <CheckSquareIcon onClick={selectAll} className='select-none text-primary size-5 ml-7 mt-2 p-1 cursor-pointer rounded-full hover:bg-muted shrink-0 box-content' />
        ) : (
          <SquareIcon onClick={selectAll} className='select-none text-foreground size-5 ml-7 mt-2 p-1 box-content cursor-pointer rounded-full hover:bg-muted shrink-0' />
        )}
        <CaretDownIcon className='text-foreground size-4 p-1 flex items-center box-content cursor-pointer rounded-full hover:bg-muted mt-1' />

        <TrashIcon 
          onClick={handleBulkDelete} 
          className={`select-none size-5 ml-5 mt-1 p-2 box-content cursor-pointer rounded-full hover:bg-muted ${
            selectedMails.length > 0 ? 'text-red-500' : 'text-muted-foreground'
          }`} 
        />
      </div>
      <h2 className="text-xl justify-items-end mb-2 text-center font-medium text-foreground ">Gönderilmiş Mailler</h2>

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
                showStar={true} 
                isSelected={selectedMails.includes(mail.id)}
                onToggleSelect={toggleSelection}
                onDelete={handleDelete}
                onToggleStar={() => handleToggleStar(mail.id, mail.isStarred ?? false)} 
                onRestore={undefined}
              />
            ))}
          </WindowVirtualizedList>

          {!id && hasMore && mails.length < totalMails && (
            <div ref={observerTarget} className='flex justify-center mt-4 mb-6 h-10'>
              {isFetchingMore && <ArrowClockwiseIcon className='size-7 p-2 text-muted-foreground box-content rounded-full animate-spin' />}
            </div>
          )}
        </>
      ) : (
        <div className="text-lg justify-items-end p-1 text-center font-medium text-muted-foreground mt-5">
          Gönderilmiş Mail yok
        </div>
      )}
    </div>
  );
};

export default Sent;