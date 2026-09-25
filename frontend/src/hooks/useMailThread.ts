import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../../src/lib/api';
import toast from 'react-hot-toast';
import type { Mail } from '../types/mail';
import useMailStore from '../stores/globalStateMails';

export const API_URL = '/emails';
export const API_TRASH_URL = '/trash';
export const API_POSTED_URL = '/posted';
export const API_STARRED_URL = '/starred';
const MAIL_CACHE_KEYS = [API_URL, API_POSTED_URL, API_STARRED_URL, API_TRASH_URL];

export function getMailUrl(mail: Mail) {
    const isPostedMail = !!mail?.to || mail?.folder === 'sent';
    return isPostedMail ? API_POSTED_URL : API_URL;
}


export function useMailThread(id: string | undefined) {
    const location = useLocation();
    const { getFolder, addMailToFolder } = useMailStore();

    const [currentId, setCurrentId] = useState(id);
    const [mail, setMail] = useState<Mail | null>(() => location.state?.mail || null);
    const [isLoading, setIsLoading] = useState(!location.state?.mail);

    if (id !== currentId) {
        setCurrentId(id);

        let resolvedMail: Mail | null = location.state?.mail || null;
        if (!resolvedMail) {
            for (const key of MAIL_CACHE_KEYS) {
                const cached = getFolder(key)?.mails?.find((m: Mail) => String(m.id) === String(id));
                if (cached) {
                    resolvedMail = cached;
                    break;
                }
            }
        }

        setMail(resolvedMail);
        setIsLoading(!resolvedMail);
    }

    useEffect(() => {
        if (mail || !id) return;

        let cancelled = false;

        const fetchMail = async () => {
            try {
                setIsLoading(true);
                let response: unknown;
                let fetchedFrom = API_URL;
                try {
                    response = await axios.get(`${API_URL}/${id}`);
                } catch {
                    fetchedFrom = API_POSTED_URL;
                    response = await axios.get(`${API_POSTED_URL}/${id}`);
                }
                const fetchedMail = ((response as { data?: unknown })?.data ?? response) as Mail;
                if (cancelled) return;
                setMail(fetchedMail);

                const targetFolder = getFolder(fetchedFrom);
                if (targetFolder?.initialized) addMailToFolder(fetchedFrom, fetchedMail);
            } catch {
                if (!cancelled) toast.error('Mail yüklenemedi.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        fetchMail();

        return () => {
            cancelled = true;
        };
    }, [id, mail, getFolder, addMailToFolder]);

    return { mail, setMail, isLoading };
}