import { useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import axios from '../lib/api';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useMailPagination } from '../hooks/useMailPagination';
import { MailSkeleton, MailItem } from '../components/MailComponents';
import { WindowVirtualizedList } from 'virtua-restoration';
import { useVirtualListStore } from '../stores/useVirtualListStore';
import type { CacheSnapshot } from "virtua";

const API_TRASH_URL = '/trash';
const API_EMAILS_URL = '/emails';
const API_POSTED_URL = '/posted';

const DeletedMails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const {
    mails, isLoading, isFetchingMore, totalMails, hasMore,
    fetchMails, handleLoadMore, removeMailsFromState, restoreMailsInState
  } = useMailPagination(API_TRASH_URL, 40);

  const currentCacheKey = 'mail-list-trash';

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
    fetchMails(1, false).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });

  }, [fetchMails]);

  useEffect(() => {
    if (!isLoading && !isFetchingMore && mails.length === 0 && totalMails > 0) {
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  }, [mails.length, totalMails, isLoading, isFetchingMore, fetchMails]);

  const goToNextAfterAction = (mailId: string | number) => {
    if (!id || String(mailId) !== String(id)) return;
    const currentIndex = mails.findIndex((m) => String(m.id) === String(id));
    const remaining = mails.filter((m) => String(m.id) !== String(id));

    if (remaining.length === 0) {
      navigate('/Trash');
      return;
    }
    const nextMail = mails[currentIndex + 1] ?? mails[currentIndex - 1];
    if (nextMail) {
      navigate(`/Trash/${nextMail.id}`);
    }
  };

  const handleRestore = async (mailId: string | number) => {
    const mailToRestore = mails.find(m => String(m.id) === String(mailId));
    if (!mailToRestore) return;
    const isPostedMail = !!mailToRestore.to || mailToRestore.folder === 'sent';
    restoreMailsInState(mailId);
    const toastId = 'mail-action-toast';

    try {
      toast.loading("Geri yükleniyor...", { id: toastId, position: 'top-center' });
      const restoreEndpoint = isPostedMail ? `${API_POSTED_URL}/${mailId}` : `${API_EMAILS_URL}/${mailId}`;
      await axios.patch(restoreEndpoint, { isDel: false });
      toast.success("Geri Yüklendi", { id: toastId, position: 'top-center', duration: 1000 });
      goToNextAfterAction(mailId);
    } catch {
      toast.error("Geri yüklenemedi!", { id: toastId, position: 'top-center', duration: 2000 });
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  };


  const handlePermanentDelete = async (mailId: string | number) => {
    const mailToDelete = mails.find(m => String(m.id) === String(mailId));
    if (!mailToDelete) return;
    const isPostedMail = !!mailToDelete.to || mailToDelete.folder === 'sent';
    removeMailsFromState(mailId);
    const toastId = 'mail-action-toast';

    try {
      toast.loading("Siliniyor...", { id: toastId, position: "top-center" });
      const deleteEndpoint = isPostedMail ? `${API_POSTED_URL}/${mailId}` : `${API_EMAILS_URL}/${mailId}`;
      await axios.delete(deleteEndpoint);
      toast.success("Tamamıyla Silindi", { id: toastId, position: 'top-center', duration: 1000 });
      goToNextAfterAction(mailId);
    } catch {
      toast.error("Silinemedi!", { id: toastId, position: 'top-center', duration: 2000 });
      fetchMails(1, false,true).then(() => {  window.scrollTo({ top: 0, behavior: 'auto' });  });
    }
  };

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />

      <h2 className="text-xl justify-items-end p-3 text-center font-medium text-foreground mt-3">Silinmiş Mailler</h2>

      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => <MailSkeleton key={index} />)
      ) : totalMails === 0 ? (
        <div className="p-4 text-muted-foreground text-center mt-5">Çöp kutusu boş.</div>
      ) : (
        <>
          {mails.length === 0 && (
            <div className="flex justify-center p-6 mt-5">
              <ArrowClockwiseIcon className="size-8 text-muted-foreground animate-spin" />
            </div>
          )}

          <WindowVirtualizedList
            cacheKey={currentCacheKey}
            customProvider={cacheProvider}
            cacheSourceType="custom"
          >
            {mails.map((mail) => (
              <MailItem
                key={mail.id}
                mail={mail}
                showStar={false}
                onRestore={handleRestore}
                onDelete={handlePermanentDelete}
                onToggleSelect={undefined}
                onToggleStar={undefined}
              />
            ))}
          </WindowVirtualizedList>

          {!id && mails.length > 0 && hasMore && mails.length < totalMails && (
            <div ref={observerTarget} className='flex justify-center mt-4 mb-6 h-10'>
              {isFetchingMore && <ArrowClockwiseIcon className='size-4 p-2 text-muted-foreground box-content rounded-full animate-spin' />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeletedMails;