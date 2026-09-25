import { useRef, useState, useEffect } from 'react';
import { 
    ArrowsOutSimpleIcon, 
    ArrowsInSimpleIcon, 
    MinusIcon, 
    PlusIcon, 
    TrashIcon, 
    XIcon, 
    FileImageIcon, 
    CircleNotchIcon, 
    SmileyIcon,
    LinkIcon as LinkIcon
} from '@phosphor-icons/react';
import { supabase } from '../../supabaseClient.js';
import useMailStore from '../stores/globalStateMails';
import { EmojiPicker } from '@ferrucc-io/emoji-picker';

interface ComposeProps {
    isCompose: boolean;
    isExtend: boolean;
    setIsExtend: (value: boolean) => void;
    isFull: boolean;
    setIsFull: (value: boolean) => void;
    to: string;
    setTo: (value: string) => void;
    subject: string;
    setSubject: (value: string) => void;
    body: string;
    setBody: (value: string) => void;
    isSending: boolean;
    newMail: () => void;
    closeCompose: () => void;
}

type EmojiSelectValue = string | { native?: string; emoji?: string };

const Compose = ({
    isCompose,
    isExtend, setIsExtend,
    isFull, setIsFull,
    to, setTo,
    subject, setSubject,
    body, setBody,
    isSending, newMail, closeCompose
}: ComposeProps) => {

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const getRecipientSuggestions = useMailStore((s) => s.getRecipientSuggestions);
    const suggestions = getRecipientSuggestions(to);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const linkModalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
                setShowEmojiPicker(false);
            }
            if (linkModalRef.current && !linkModalRef.current.contains(target)) {
                setShowLinkModal(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isFull) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isFull]);

    const handleEmojiSelect = (emoji: EmojiSelectValue) => {
        const emojiChar = typeof emoji === 'string' ? emoji : emoji.native || emoji.emoji || '';
        setBody(body + emojiChar);
    };

    const handleAddLink = () => {
        if (!linkUrl) return;
        
        let formattedUrl = linkUrl;
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const textToDisplay = linkText.trim() === '' ? formattedUrl : linkText;
        
        const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6 !important; text-decoration: underline !important;">${textToDisplay}</a>`;
        
        setBody(body + (body ? ' ' : '') + linkHtml + ' '); 
        
        setShowLinkModal(false);
        setLinkText('');
        setLinkUrl('');
    };

    if (!isCompose) return null;

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
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase Yükleme Hatası:', uploadError);
                alert('Görsel yüklenirken bir hata oluştu.');
                return;
            }

            const { data } = supabase.storage
                .from('email-attachments')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            setBody(body + `\n<img src="${publicUrl}" alt="uploaded image" style="max-width: 100%;" />\n`);

        } catch (error) {
            console.error('Yükleme işlemi sırasında beklenmeyen hata:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileInput = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const emojiPickerComponent = (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 shadow-2xl rounded-lg bg-white dark:bg-zinc-900 border border-border">
            <EmojiPicker
                className="font-['Lato'] w-[380px] border-none"
                emojisPerRow={9}
                emojiSize={36}
                onEmojiSelect={handleEmojiSelect}
            >
                <EmojiPicker.Header>
                    <EmojiPicker.Input
                        placeholder="Search all emoji"
                        className="h-[36px] bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 w-full rounded-[8px] text-[15px] focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] dark:focus:shadow-[0_0_0_1px_#1d9bd1,0_0_0_6px_rgba(29,155,209,0.3)] focus:border-transparent focus:outline-none mb-1"
                        hideIcon
                    />
                </EmojiPicker.Header>
                <EmojiPicker.Group>
                    <EmojiPicker.List containerHeight={320} />
                </EmojiPicker.Group>
                <EmojiPicker.Preview>
                    {({ previewedEmoji }) => (
                        <>
                            {previewedEmoji ?
                                <EmojiPicker.Content />
                                :
                                <button type="button" className="text-sm text-muted-foreground">Add Emoji</button>
                            }
                            <EmojiPicker.SkinTone />
                        </>
                    )}
                </EmojiPicker.Preview>
            </EmojiPicker>
        </div>
    );

    const linkModalComponent = (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-80 p-3 bg-background border border-border shadow-2xl rounded-xl flex flex-col gap-3">
            <div className="flex items-center border border-border rounded-md px-2 py-1 bg-transparent focus-within:ring-1 focus-within:ring-primary">
                <span className="text-muted-foreground mr-2 font-bold select-none">=</span>
                <input 
                    type="text"
                    placeholder="Metin"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="flex-1 py-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
                />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center border border-border rounded-md px-2 py-1 bg-transparent focus-within:ring-1 focus-within:ring-primary">
                    <LinkIcon className="text-muted-foreground mr-2 size-4" />
                    <input 
                        type="url"
                        placeholder="Bağlantı yazın veya yapıştırın"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') handleAddLink() }}
                        className="flex-1 py-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <button 
                    type="button" 
                    onClick={handleAddLink}
                    disabled={!linkUrl}
                    className="text-primary cursor-pointer font-semibold text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
                >
                    Uygula
                </button>
            </div>
        </div>
    );

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {isFull ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="w-[80vw] h-[85vh] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center px-4 py-3 bg-muted">
                            <span className="flex-1 text-sm font-semibold text-foreground">Yeni İleti</span>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <MinusIcon onClick={() => { setIsFull(false); setIsExtend(false); }} className="cursor-pointer size-4 hover:text-foreground" />
                                <ArrowsInSimpleIcon onClick={() => setIsFull(false)} className="cursor-pointer size-4 hover:text-foreground" />
                                <XIcon onClick={closeCompose} className="cursor-pointer size-4 hover:text-foreground" />
                            </div>
                        </div>

                        <div className="flex flex-col flex-1">
                            <div className="relative flex items-center px-4 py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm mr-2">Kime</span>
                                <input
                                    type="text"
                                    value={to}
                                    onChange={(e) => { setTo(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    placeholder='örn: john@example.com'
                                    className="flex-1 outline-none text-sm text-foreground bg-transparent"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
                                        {suggestions.map((s) => (
                                            <li
                                                key={s.email}
                                                onMouseDown={() => { setTo(s.email); setShowSuggestions(false); }}
                                                className="px-4 py-2 text-sm cursor-pointer hover:bg-muted"
                                            >
                                                {s.email}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex items-center px-4 py-2 border-b border-border">
                                <input
                                    type="text"
                                    placeholder="Konu"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground"
                                />
                            </div>

                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="flex-1 p-4 outline-none resize-none text-sm text-foreground bg-transparent"
                            />

                            <div className="px-4 pb-4 flex flex-col">
                                <div className="flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={newMail}
                                        disabled={isSending}
                                        className={`text-primary-foreground ml-3 rounded-full text-sm font-medium px-6 py-2 outline-none transition-colors cursor-pointer select-none ${isSending ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:opacity-90 cursor-pointer'}`}
                                    >
                                        {isSending ? 'Gönderiliyor...' : 'Gönder'}
                                    </button>

                                    <div className="flex items-center gap-3 mr-auto ml-5">
                                        <div className="relative flex items-center" ref={linkModalRef}>
                                            <LinkIcon
                                                onClick={() => { setShowLinkModal(!showLinkModal); setShowEmojiPicker(false); }}
                                                className={`size-6 box-content cursor-pointer transition-colors ${showLinkModal ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            />
                                            {showLinkModal && linkModalComponent}
                                        </div>

                                        {isUploading ? (
                                            <CircleNotchIcon className="size-6 animate-spin text-primary" />
                                        ) : (
                                            <FileImageIcon
                                                onClick={triggerFileInput}
                                                className="size-6 box-content cursor-pointer text-muted-foreground hover:text-foreground"
                                            />
                                        )}
                                        
                                        <div className="relative flex items-center" ref={emojiPickerRef}>
                                            <SmileyIcon
                                                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowLinkModal(false); }}
                                                className={`size-6 box-content cursor-pointer transition-colors ${showEmojiPicker ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            />
                                            {showEmojiPicker && emojiPickerComponent}
                                        </div>
                                    </div>

                                    <TrashIcon onClick={closeCompose} className="cursor-pointer text-muted-foreground hover:text-foreground size-5 box-content" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {isExtend ? (
                        <div className="fixed z-[100] bottom-0 left-2 right-2 sm:left-auto sm:right-5 w-auto sm:w-[520px] h-[70vh] sm:h-[520px] bg-background rounded-t-xl shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-border flex flex-col">
                            <div className="flex items-center p-3 bg-muted rounded-t-xl border-b border-border">
                                <span className="flex-1 text-sm font-semibold text-foreground">Yeni İleti</span>
                                <div className="flex gap-3 text-muted-foreground">
                                    <MinusIcon onClick={() => setIsExtend(false)} className="cursor-pointer size-4 hover:text-foreground" />
                                    <ArrowsOutSimpleIcon onClick={() => setIsFull(true)} className="cursor-pointer size-4 hover:text-foreground" />
                                    <XIcon onClick={closeCompose} className="cursor-pointer size-4 hover:text-foreground" />
                                </div>
                            </div>
                            <div className="relative flex items-center px-4 py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm mr-2">Kime</span>
                                <input
                                    type="text"
                                    value={to}
                                    onChange={(e) => { setTo(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    className="flex-1 outline-none text-sm text-foreground bg-transparent"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
                                        {suggestions.map((s) => (
                                            <li
                                                key={s.email}
                                                onMouseDown={() => { setTo(s.email); setShowSuggestions(false); }}
                                                className="px-4 py-2 text-sm cursor-pointer hover:bg-muted"
                                            >
                                                {s.email}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex items-center px-4 py-2 border-b border-border">
                                <span className="text-muted-foreground text-sm mr-2">Konu</span>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="flex-1 outline-none text-sm text-foreground bg-transparent"
                                />
                            </div>

                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="flex-1 p-4 outline-none resize-none text-sm text-foreground bg-transparent"
                            />

                            <div className="flex justify-between items-center mb-3 pr-3 pl-3">
                                <button
                                    type="button"
                                    onClick={newMail}
                                    disabled={isSending}
                                    className={`text-primary-foreground rounded-full w-32 text-sm font-medium p-2 cursor-pointer transition-colors ${isSending ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:opacity-90'}`}
                                >
                                    {isSending ? 'Gönderiliyor...' : 'Gönder'}
                                </button>

                                <div className="flex items-center gap-3 mr-auto ml-4">
                                    <div className="relative flex items-center" ref={linkModalRef}>
                                        <LinkIcon
                                            onClick={() => { setShowLinkModal(!showLinkModal); setShowEmojiPicker(false); }}
                                            className={`size-6 box-content cursor-pointer transition-colors ${showLinkModal ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        />
                                        {showLinkModal && linkModalComponent}
                                    </div>

                                    {isUploading ? (
                                        <CircleNotchIcon className="size-6 animate-spin text-primary" />
                                    ) : (
                                        <FileImageIcon
                                            onClick={triggerFileInput}
                                            className="size-6 box-content cursor-pointer text-muted-foreground hover:text-foreground"
                                        />
                                    )}
                                    
                                    <div className="relative flex items-center" ref={emojiPickerRef}>
                                        <SmileyIcon
                                            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowLinkModal(false); }}
                                            className={`size-6 box-content cursor-pointer transition-colors ${showEmojiPicker ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        />
                                        {showEmojiPicker && emojiPickerComponent}
                                    </div>
                                </div>

                                <TrashIcon onClick={closeCompose} className="size-5 box-content cursor-pointer text-muted-foreground hover:text-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="absolute right-20 bottom-0 flex rounded-t-lg items-center p-3 bg-muted text-foreground w-64 border border-border shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-50 cursor-pointer" onClick={() => setIsExtend(true)}>
                            <span className="flex-1 text-sm font-semibold text-foreground">Yeni İleti</span>
                            <div className="flex gap-3 text-muted-foreground">
                                <PlusIcon className="cursor-pointer size-4 hover:text-foreground" />
                                <ArrowsOutSimpleIcon onClick={(e) => { e.stopPropagation(); setIsFull(true); }} className="cursor-pointer size-4 hover:text-foreground" />
                                <XIcon onClick={(e) => { e.stopPropagation(); closeCompose(); }} className="cursor-pointer size-4 hover:text-foreground" />
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default Compose;