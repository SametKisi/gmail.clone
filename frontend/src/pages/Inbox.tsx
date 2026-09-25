import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowBendUpLeftIcon } from '@phosphor-icons/react';
import axios from '../../src/lib/api';
import useMailStore from '../stores/globalStateMails';
import { useMailThread, getMailUrl, API_TRASH_URL } from '../hooks/useMailThread';
import { useReplyComposer } from '../hooks/useReplyComposer';
import MailBody from '../components/Inbox_Hooks/MailBody';
import MailToolbar from '../components/Inbox_Hooks/MailToolbar';
import MailHeaderInfo from '../components/Inbox_Hooks/MailHeaderInfo';
import ReplyComposer from '../components/Inbox_Hooks/ReplyComposer';

const toStr = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

const Inbox = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { mail, setMail, isLoading } = useMailThread(id);
  const { toggleStarInFolder, deleteMailEverywhere, restoreMailEverywhere, removeMailFromFolder } = useMailStore();

  const isStared = mail ? Boolean(mail.isStarred) : false;
  const isPosted = mail?.folder === 'sent' || Boolean(mail?.to && !mail?.sender);
  const displayName = isPosted ? 'Samet Kişi' : toStr(mail?.sender);
  const displayEmail = isPosted ? 'peklife9912@gmail.com' : toStr(mail?.from);
  const targetRecipient = isPosted ? toStr(mail?.to) : 'ben';
  const avatarLetter = displayName ? displayName[0] : 'G';

  const {
    isReplying, setIsReplying, replyBody, setReplyBody, isSendingReply, replyInputRef,
    showEmojiPicker, setShowEmojiPicker, emojiPickerRef, handleEmojiSelect,
    showLinkModal, setShowLinkModal, linkModalRef, linkText, setLinkText, linkUrl, setLinkUrl, handleAddLink,
    isUploading, fileInputRef, handleImageUpload, triggerFileInput,
    handleSendReply, cancelReply,
  } = useReplyComposer(mail, isPosted, displayName, displayEmail);

  const handleToggleStar = async () => {
    if (!mail) return;
    const targetUrl = getMailUrl(mail);
    const wasStarred = mail.isStarred;

    toggleStarInFolder('', mail.id);
    setMail((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : prev));
    try {
      await axios.patch(`${targetUrl}/${mail.id}`, { isStarred: !wasStarred });
    } catch {
      toggleStarInFolder('', mail.id);
      setMail((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : prev));
      toast.error('Yıldız güncellenemedi!');
    }
  };

  const handleDelete = async () => {
    if (!mail) return;
    const targetUrl = getMailUrl(mail);
    const alreadyInTrash = mail.isDel === true;

    if (alreadyInTrash) {
      removeMailFromFolder(API_TRASH_URL, mail.id);
      navigate('/Deleted');
      try {
        const loadToast = toast.loading('Siliniyor...', { position: 'top-center' });
        await axios.delete(`${targetUrl}/${mail.id}`);
        toast.dismiss(loadToast);
        toast.success('Tamamıyla Silindi', { position: 'top-center', duration: 500 });
      } catch {
        toast.error('Silinemedi!', { position: 'top-center', duration: 2000 });
        restoreMailEverywhere(mail.id);
      }
    } else {
      deleteMailEverywhere(mail.id);
      navigate(-1);
      try {
        await axios.patch(`${targetUrl}/${mail.id}`, { isDel: true });
        toast.success('Mail çöpe taşındı.', { position: 'top-center', duration: 500 });
      } catch {
        restoreMailEverywhere(mail.id);
        toast.error('Mail çöpe taşınamadı!');
      }
    }
  };
  
  if (isLoading) return <div className="p-4 sm:p-8 text-center text-muted-foreground">Mail yükleniyor...</div>;
  if (!mail) return <div className="p-4 sm:p-8 text-center text-muted-foreground">Mail bulunamadı.</div>;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="p-4 sm:p-6 md:px-8 pb-20 overflow-y-auto w-full">
        <MailToolbar onBack={() => navigate(-1)} onDelete={handleDelete} />

        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl text-foreground font-normal wrap-break-word">{toStr(mail.subject)}</h1>
        </div>

        <MailHeaderInfo
          avatarLetter={avatarLetter}
          displayName={displayName}
          displayEmail={displayEmail}
          targetRecipient={targetRecipient}
          date={mail.date}
          isStarred={isStared}
          onToggleStar={handleToggleStar}
        />

        <MailBody body={toStr(mail.body)} />

        {!isPosted && (
          <div className="mt-8 border-t border-border pt-4">
            {!isReplying ? (
              <button
                onClick={() => setIsReplying(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full border border-border hover:bg-muted text-sm font-medium text-foreground transition-colors cursor-pointer"
              >
                <ArrowBendUpLeftIcon size={18} weight="bold" />
                Yanıtla
              </button>
            ) : (
              <ReplyComposer
                mail={mail}
                composer={{
                  isReplying, setIsReplying, replyBody, setReplyBody, isSendingReply, replyInputRef,
                  showEmojiPicker, setShowEmojiPicker, emojiPickerRef, handleEmojiSelect,
                  showLinkModal, setShowLinkModal, linkModalRef, linkText, setLinkText, linkUrl, setLinkUrl, handleAddLink,
                  isUploading, fileInputRef, handleImageUpload, triggerFileInput,
                  handleSendReply, cancelReply,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;