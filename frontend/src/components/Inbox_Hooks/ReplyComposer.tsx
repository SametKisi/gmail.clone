import {
  ArrowBendUpLeftIcon, CaretDownIcon, LinkIcon, SmileyIcon, ImageSquareIcon, CircleNotchIcon, TrashIcon,
} from '@phosphor-icons/react';
import EmojiPickerPopover from './EmojiPickerPopover';
import LinkModalPopover from './LinkModalPopover';
import type { Mail } from '../../types/mail';
import type { useReplyComposer } from '../../hooks/useReplyComposer';

const toStr = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

type Props = { mail: Mail; composer: ReturnType<typeof useReplyComposer> };

const ReplyComposer = ({ mail, composer }: Props) => {
  const {
    replyBody, setReplyBody, isSendingReply, replyInputRef,
    showEmojiPicker, setShowEmojiPicker, emojiPickerRef, handleEmojiSelect,
    showLinkModal, setShowLinkModal, linkModalRef, linkText, setLinkText, linkUrl, setLinkUrl, handleAddLink,
    isUploading, triggerFileInput, handleSendReply, cancelReply,
  } = composer;

  return (
    <div className="border border-border rounded-xl shadow-sm bg-background flex flex-col mt-4 transition-all w-full">
      <div className="overflow-hidden rounded-t-xl">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-foreground cursor-pointer px-2 py-1 hover:bg-muted rounded-md max-w-full min-w-0">
            <ArrowBendUpLeftIcon size={16} className="shrink-0" />
            <CaretDownIcon size={12} weight="bold" className="shrink-0" />
            <span className="ml-1 font-medium truncate">{toStr(mail.sender)} ({toStr(mail.from)})</span>
          </div>
        </div>

        <textarea
          ref={replyInputRef}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Yanıtınızı buraya yazın..."
          className="w-full min-h-40 p-3 sm:p-4 bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-background flex-wrap gap-2 rounded-b-xl">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex rounded-full overflow-hidden bg-[#0b57d0] hover:bg-[#0b57d0]/90 transition-colors shrink-0">
            <button onClick={handleSendReply} disabled={isSendingReply} className="px-4 sm:px-6 py-2 text-sm font-medium text-white disabled:opacity-70 cursor-pointer">
              {isSendingReply ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            <div className="w-px bg-white/20 h-auto my-1"></div>
            <button className="px-2 py-2 text-white hover:bg-white/10 cursor-pointer">
              <CaretDownIcon size={16} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
            <div className="relative flex items-center" ref={linkModalRef}>
              <LinkIcon
                onClick={() => { setShowLinkModal(!showLinkModal); setShowEmojiPicker(false); }}
                size={20}
                className={`cursor-pointer p-1 box-content rounded transition-colors ${showLinkModal ? 'text-primary bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              />
              {showLinkModal && (
                <LinkModalPopover linkText={linkText} onLinkTextChange={setLinkText} linkUrl={linkUrl} onLinkUrlChange={setLinkUrl} onSubmit={handleAddLink} />
              )}
            </div>

            <div className="relative flex items-center" ref={emojiPickerRef}>
              <SmileyIcon
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowLinkModal(false); }}
                size={20}
                className={`cursor-pointer p-1 box-content rounded transition-colors ${showEmojiPicker ? 'text-primary bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              />
              {showEmojiPicker && <EmojiPickerPopover onSelect={handleEmojiSelect} />}
            </div>

            {isUploading ? (
              <CircleNotchIcon size={20} className="animate-spin text-primary p-1 box-content" />
            ) : (
              <ImageSquareIcon onClick={triggerFileInput} size={20} className="cursor-pointer hover:text-foreground p-1 box-content rounded hover:bg-muted" />
            )}
          </div>
        </div>

        <TrashIcon onClick={cancelReply} size={20} className="cursor-pointer text-muted-foreground hover:text-foreground p-2 box-content rounded-full hover:bg-muted shrink-0" />
      </div>
    </div>
  );
};

export default ReplyComposer;