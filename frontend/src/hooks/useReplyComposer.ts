import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDateForDisplay } from '../../../backend/utils/formatDateForDisplay.js';
import { supabase } from '../../supabaseClient.js';
import type { Mail } from '../types/mail';
import useMailStore from '../stores/globalStateMails';
import axios from '../../src/lib/api';
import { API_POSTED_URL } from './useMailThread';

type EmojiSelectValue = string | { native?: string; emoji?: string };
const toStr = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

export function useReplyComposer(mail: Mail | null, isPosted: boolean, displayName: string, displayEmail: string) {
    const { getFolder, addMailToFolder } = useMailStore();

    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const linkModalRef = useRef<HTMLDivElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Yanıt kutusu açıldığında imleci içine al ve görünür alana kaydır.
    useEffect(() => {
        if (isReplying && replyInputRef.current) {
            replyInputRef.current.focus();
            replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isReplying]);

    // Emoji/link popover'larının dışına tıklanınca kapat.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) setShowEmojiPicker(false);
            if (linkModalRef.current && !linkModalRef.current.contains(target)) setShowLinkModal(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiSelect = (emoji: EmojiSelectValue) => {
        const emojiChar = typeof emoji === 'string' ? emoji : emoji.native || emoji.emoji || '';
        setReplyBody((prev) => prev + emojiChar);
    };

    const handleAddLink = () => {
        if (!linkUrl) return;
        let formattedUrl = linkUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = 'https://' + formattedUrl;

        const textToDisplay = linkText.trim() === '' ? formattedUrl : linkText;
        const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6 !important; text-decoration: underline !important;">${textToDisplay}</a>`;

        setReplyBody(replyBody + (replyBody ? ' ' : '') + linkHtml + ' ');
        setShowLinkModal(false);
        setLinkText('');
        setLinkUrl('');
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `compose-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('email-attachments')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Supabase Yükleme Hatası:', uploadError);
                toast.error('Görsel yüklenirken bir hata oluştu.');
                return;
            }

            const { data } = supabase.storage.from('email-attachments').getPublicUrl(filePath);
            setReplyBody(replyBody + `\n<img src="${data.publicUrl}" alt="uploaded image" style="max-width: 100%;" />\n`);
        } catch (error) {
            console.error('Yükleme işlemi sırasında beklenmeyen hata:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        if (!isUploading) fileInputRef.current?.click();
    };

    const handleSendReply = async () => {
        if (!mail) return;
        if (!replyBody.trim()) {
            toast.error('Lütfen bir mesaj girin.', { position: 'bottom-left' });
            return;
        }

        setIsSendingReply(true);
        const toastId = toast.loading('Yanıt gönderiliyor...', { position: 'top-center' });

        const subject = toStr(mail.subject);
        const sender = toStr(mail.sender);
        const from = toStr(mail.from);
        const to = toStr(mail.to);
        const body = toStr(mail.body);

        const replySubject = subject.toLowerCase().startsWith('yanıtlandı:') ? subject : `Yanıtlandı: ${sender} - ${subject}`;
        const combinedBody =
            `--- ${formatDateForDisplay(mail.date)} tarihinde ${displayName} <${displayEmail}> şunları yazdı ---\n\n` +
            `${body}\n\n` +
            `Yanıtlandı : &nbsp \n` +
            `${replyBody.trim()}`;

        const newReplyMail = {
            id: Date.now().toString(),
            from: 'peklife9912@gmail.com',
            to: isPosted ? to : from,
            subject: replySubject,
            body: combinedBody,
            date: new Date().toISOString(),
            isDel: false,
            folder: 'sent',
        };

        try {
            await axios.post(API_POSTED_URL, newReplyMail);

            const sentFolder = getFolder(API_POSTED_URL);
            if (sentFolder && sentFolder.initialized) addMailToFolder(API_POSTED_URL, newReplyMail);

            setReplyBody('');
            setIsReplying(false);
            toast.success('Yanıt gönderildi.', { id: toastId, position: 'top-center', duration: 1500 });
        } catch {
            toast.error('Yanıt gönderilemedi!', { id: toastId, position: 'top-center' });
        } finally {
            setIsSendingReply(false);
        }
    };

    const cancelReply = () => {
        setIsReplying(false);
        setReplyBody('');
    };

    return {
        isReplying, setIsReplying, replyBody, setReplyBody, isSendingReply, replyInputRef,
        showEmojiPicker, setShowEmojiPicker, emojiPickerRef, handleEmojiSelect,
        showLinkModal, setShowLinkModal, linkModalRef, linkText, setLinkText, linkUrl, setLinkUrl, handleAddLink,
        isUploading, fileInputRef, handleImageUpload, triggerFileInput,
        handleSendReply, cancelReply,
    };
}