import Header from "../components/Header";
import SideBar from "../components/SideBar";
import { useEffect, useState, useRef, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from '../../src/lib/api';
import useMailStore from "../stores/globalStateMails";
import toast, { Toaster } from 'react-hot-toast';
import Compose from "../components/Compose";
import { MailSkeleton } from '../components/MailComponents.js';
import { supabase } from '../../supabaseClient.js';
import { ArrowClockwiseIcon, ArrowUpIcon, XIcon } from '@phosphor-icons/react';
import { useCurrentUser } from '../hooks/useCurrentUser';


export interface MailData {
    [key: string]: string | boolean;
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    isDel: boolean;
    folder: string;
}

export interface ShowDeleteToastFn {
    (
        mailIds: (string | number) | (string | number)[],
        urlMap: { [key: string]: number | string },
        onUndo: (ids: (string | number)[]) => void
    ): void;
}

const Layout = () => {
    const API_EMAILS_URL = "/emails";
    const API_POSTED_URL = "/posted";
    const navigate = useNavigate();

    const { user, isLoading: isUserLoading } = useCurrentUser();

    const [isOpen, setIsOpen] = useState(false);
    const [isCompose, setIsCompose] = useState(false);
    const [isExtend, setIsExtend] = useState(true);
    const [isFull, setIsFull] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [newMailCount, setNewMailCount] = useState<number>(0);
    const recentlySyncedIds = useRef<Set<string | number>>(new Set());

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });


    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const { addMailToFolder, getFolder, addRecentRecipient } = useMailStore();
    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleUndo = async (
        mailIds: (string | number)[],
        urlMap: { [key: string]: number | string },
        onUndo: (ids: (string | number)[]) => void
    ) => {
        onUndo(mailIds);
        toast.success("İşlem geri alındı.", { position: 'top-center', duration: 600 });

        try {
            await Promise.all(
                mailIds.map((mailId) =>
                    axios.patch(`${urlMap[mailId] ?? API_EMAILS_URL}/${mailId}`, { isDel: false })
                )
            );
        } catch {

            toast.error("Geri alma işlemi sunucuya kaydedilemedi, daha sonra tekrar dener.", { position: 'top-center' });
        }
    };

    const showDeleteToast: ShowDeleteToastFn = (
        mailIds,
        urlMap,
        onUndo
    ) => {
        toast.dismiss('delete-toast');
        const ids = Array.isArray(mailIds) ? mailIds : [mailIds];

        toast.custom(
            (t) => (
                <div className={`${t.visible ? 'animate-toast-enter' : 'animate-toast-leave'}  flex items-center bg-foreground text-background px-5 py-3 rounded-md shadow-lg pointer-events-auto min-w-[320px] justify-between`}>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium tracking-wide">İleti dizisi Çöp Kutusu'na taşındı.</span>
                        <button
                            onClick={() => { toast.dismiss(t.id); handleUndo(ids, urlMap, onUndo); }}
                            className="text-primary cursor-pointer text-sm font-medium hover:bg-background/20 px-2 py-1.5 rounded transition-colors"
                        >
                            Geri al
                        </button>
                    </div>
                    <button onClick={() => toast.dismiss(t.id)} className="cursor-pointer text-muted-foreground hover:text-background hover:bg-background/20 p-1.5 rounded-full transition-colors ml-2">
                        <XIcon className="size-4 cursor-pointer" weight="bold" />
                    </button>
                </div>
            ),
            { id: 'delete-toast', duration: 4000, position: 'bottom-left' }
        );
    };

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const checkScrollPosition = () => {
            if (window.scrollY > 200) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', checkScrollPosition);

        return () => {
            window.removeEventListener('scroll', checkScrollPosition);
        };
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('mail-akisi')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mails',
                    filter: `user_id=eq.${user.id}`, // "to" değil, doğru kolon bu
                },
                (payload) => {
                    // kendi gönderdiğim mail (kendi sent kopyam) sayacı artırmasın
                    if (payload.new?.sender === user.email) return;

                    const newId = payload.new?.id;
                    if (newId !== undefined && recentlySyncedIds.current.has(newId)) {
                        recentlySyncedIds.current.delete(newId);
                        return;
                    }
                    setNewMailCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id, user?.email]);

    const handleNewMailClick = () => {
        setNewMailCount(0);
        navigate('/', { state: { forceRefresh: Date.now() } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const createMail = async (newMailData: MailData) => {
        setIsSending(true);
        const toastId = toast.loading("Gönderiliyor...", { position: "top-center" });

        try {
            await axios.post(API_POSTED_URL, newMailData);

            const sentFolder = getFolder(API_POSTED_URL);
            if (sentFolder && sentFolder.initialized) {
                addMailToFolder(API_POSTED_URL, newMailData);
            }

            addRecentRecipient(newMailData.to);

            setTo('');
            setSubject('');
            setBody('');
            setIsFull(false);
            setIsCompose(false);

            toast.success("İleti gönderildi.", { id: toastId, position: "top-center", duration: 500 });
        } catch (err) {
            console.error("Mail gönderme hatası:", err);
            toast.error("İleti gönderilemedi lütfen eposta stilini kontrol edin!", { id: toastId, position: "top-center" });
        } finally {
            setIsSending(false);
        }
    };

    

    const newMail = () => {
        if (!to.trim() || !subject.trim()) {
            toast.error("Lütfen 'Kime' ve 'Konu' alanlarını doldurun.", { position: "bottom-left" });
            return;
        }

        const accountEmail = user?.email ?? '';

        const mailData = {
            id: Date.now().toString(),
            from: accountEmail || "bilinmeyen@kullanici",
            to: to.trim(),
            subject: subject.trim(),
            body: body,
            date: new Date().toISOString(),
            isDel: false,
            folder: 'sent'
        };
        createMail(mailData);
    };

    const closeCompose = () => {
        setTo('');
        setSubject('');
        setBody('');
        setIsCompose(false);
        setIsFull(false);
    };

    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background text-foreground">
                <ArrowClockwiseIcon className="size-8 animate-spin text-muted-foreground" />
                <div>Yükleniyor...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                Oturum bulunamadı, giriş sayfasına yönlendiriliyor...
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
            <Toaster />

            {newMailCount > 0 && (
                <div className="fixed justify-center items-center z-[100] w-full flex top-10 left-0">
                    <button
                        onClick={handleNewMailClick}
                        className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm px-5 py-2.5 rounded-full shadow-md transition-all cursor-pointer"
                    >
                        <ArrowClockwiseIcon className="size-4 animate-spin" />
                        {newMailCount} yeni ileti var. Yüklemek için tıklayın.
                    </button>
                </div>
            )}
            {showScrollTop && (
                <div className="fixed right-5 bottom-5 z-100 transition-all duration-300 animate-fade-in">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center justify-center p-3 bg-primary hover:opacity-90 text-primary-foreground rounded-full shadow-lg transition-all cursor-pointer"
                    >
                        <ArrowUpIcon className="size-5 z-20" />
                    </button>
                </div>
            )}

            <div className="sticky top-0 z-50 bg-background w-full">
                <Header toggleSidebar={toggleSidebar} theme={theme} toggleTheme={toggleTheme} />
            </div>

            <div className="flex flex-1 items-start relative">
                <div className="sticky top-16">
                    <SideBar
                        isOpen={isOpen}
                        setIsCompose={setIsCompose}
                    />
                </div>

                <main className="flex-1 bg-background relative min-w-0" style={{ overflowAnchor: 'none' }}>
                    <Suspense fallback={<MailSkeleton />}>
                        <Outlet context={{ showDeleteToast }} />
                    </Suspense>
                </main>
            </div>

            <Compose
                isCompose={isCompose}
                isExtend={isExtend}
                setIsExtend={setIsExtend}
                isFull={isFull}
                setIsFull={setIsFull}
                to={to}
                setTo={setTo}
                subject={subject}
                setSubject={setSubject}
                body={body}
                setBody={setBody}
                isSending={isSending}
                newMail={newMail}
                closeCompose={closeCompose}
            />
        </div>
    )
}

export default Layout;