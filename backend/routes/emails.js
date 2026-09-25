import express from 'express';
import { supabase } from '../../backend/supabaseClient.js';
import { parseTurkishDate } from '../utils/dateHelper.js';
import { requireAuth } from '../middleware/requireAuth.js';


const router = express.Router();
router.use(requireAuth);

const getSortTime = (mail) =>
    mail.received_at ? new Date(mail.received_at).getTime() : parseTurkishDate(mail.date).getTime();

router.get('/emails', async (req, res) => {
    try {
        const start = parseInt(req.query.start, 10) || 0;
        const end = parseInt(req.query.end, 10) || 32;

        const { count: mailsCount, error: mailsCountError } = await supabase
            .from('mails')
            .select('*', { count: 'exact', head: true })
            .eq('isDel', false)
            .eq('user_id', req.userId);

        const { count: postedCount, error: postedCountError } = await supabase
            .from('posted')
            .select('*', { count: 'exact', head: true })
            .eq('isDel', false)
            .eq('user_id', req.userId);

        if (mailsCountError || postedCountError) {
            console.error("COUNT HATASI (mails):", mailsCountError);
            console.error("COUNT HATASI (posted):", postedCountError);
            return res.status(500).json({ hata: "Veriler alınamadı." });
        }

        let mails = [];
        if (start < (mailsCount || 0)) {
            const { data, error: mailsError } = await supabase
                .from('mails')
                .select('id, sender, subject, date, isDel, isStarred, body, name, starred_at, received_at')
                .eq('isDel', false)
                .eq('user_id', req.userId)
                .order('received_at', { ascending: false, nullsFirst: false })
                .order('id', { ascending: false })
                .range(start, end);

            if (mailsError) {
                console.error("MAILS SELECT HATASI:", mailsError);
                return res.status(500).json({ hata: "Veriler alınamadı." });
            }
            mails = data || [];
        }

        let posted = [];
        if (start < (postedCount || 0)) {
            const { data, error: postedError } = await supabase
                .from('posted')
                .select('id, sender, receiver, subject, body, date, isDel, folder, starred_at')
                .eq('isDel', false)
                .eq('user_id', req.userId)
                .order('id', { ascending: false })
                .range(start, end);

            if (postedError) {
                console.error("POSTED SELECT HATASI:", postedError);
                return res.status(500).json({ hata: "Veriler alınamadı." });
            }
            posted = data || [];
        }

        const formattedMails = mails.map(m => ({
            id: m.id,
            sender: m.name,
            from: m.sender,
            subject: m.subject,
            date: m.date,
            isDel: !!m.isDel,
            isStarred: !!m.isStarred,
            body: m.body,
            starredAt: m.starred_at,
            receivedAt: m.received_at,
            received_at: m.received_at
        })).sort((a, b) => getSortTime(b) - getSortTime(a));

        const formattedPosted = posted.map(p => ({
            id: p.id,
            from: p.sender,
            to: p.receiver,
            subject: p.subject,
            body: p.body,
            date: p.date,
            isDel: !!p.isDel,
            folder: p.folder,
            starredAt: p.starred_at
        })).sort((a, b) => getSortTime(b) - getSortTime(a));

        res.json({ mails: formattedMails, posted: formattedPosted, totalMails: mailsCount || 0 });
    } catch (error) {
        console.error("EMAILS GENEL HATASI:", error);
        res.status(500).json({ hata: "Sunucu hatası." });
    }
});


router.get('/starred', async (req, res) => {
    try {
        const start = parseInt(req.query.start, 10) || 0;
        const end = parseInt(req.query.end, 10) || 32;

        const { data: starredMails, error: mailsError } = await supabase
            .from('mails')
            .select('id, sender, subject, date, isDel, isStarred, body, name, starred_at, received_at')
            .eq('isDel', false)
            .eq('isStarred', true)
            .eq('user_id', req.userId);

        if (mailsError) {
            console.error("STARRED MAILS HATASI:", mailsError);
            return res.status(500).json({ hata: "Veriler alınamadı." });
        }

        const { data: starredPosted, error: postedError } = await supabase
            .from('posted')
            .select('id, sender, receiver, subject, body, date, isDel, folder, isStarred, starred_at')
            .eq('isDel', false)
            .eq('isStarred', true)
            .eq('user_id', req.userId);

        if (postedError) {
            console.error("STARRED POSTED HATASI:", postedError);
            return res.status(500).json({ hata: "Veriler alınamadı." });
        }

        const formattedMails = (starredMails || []).map(m => ({
            id: m.id,
            sender: m.name,
            from: m.sender,
            subject: m.subject,
            date: m.date,
            isDel: !!m.isDel,
            isStarred: !!m.isStarred,
            body: m.body,
            starredAt: m.starred_at,
            receivedAt: m.received_at
        }));

        const formattedPosted = (starredPosted || []).map(p => ({
            id: p.id,
            from: p.sender,
            to: p.receiver,
            subject: p.subject,
            body: p.body,
            date: p.date,
            isDel: !!p.isDel,
            isStarred: !!p.isStarred,
            starredAt: p.starred_at
        }));

        const getStarredSortTime = (mail) => {
            if (mail.starredAt) return new Date(mail.starredAt).getTime();
            if (mail.receivedAt) return new Date(mail.receivedAt).getTime();
            return parseTurkishDate(mail.date).getTime();
        };

        const combined = [...formattedMails, ...formattedPosted]
            .sort((a, b) => getStarredSortTime(b) - getStarredSortTime(a));

        const totalCount = combined.length;
        const paged = combined.slice(start, end + 1);

        res.json({ mails: paged, totalMails: totalCount });
    } catch (error) {
        console.error("STARRED GENEL HATASI:", error);
        res.status(500).json({ hata: "Sunucu hatası." });
    }
});

router.patch('/emails/:id', async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updates, 'isStarred')) {
        updates.starred_at = updates.isStarred ? new Date().toISOString() : null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'isDel')) {
        updates.deleted_at = updates.isDel ? new Date().toISOString() : null;
    }

    try {
        const { data, error } = await supabase
            .from('mails')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.userId)
            .select();

        if (error) {
            console.error("PATCH HATASI:", error);
            return res.status(500).json({ hata: "Mail güncellenemedi." });
        }

        if (!data || data.length === 0) {
            console.error("PATCH UYARI: Hiçbir satır güncellenmedi. id:", id, "updates:", updates);
            return res.status(404).json({ hata: "Güncellenecek mail bulunamadı (RLS ya da ID uyuşmazlığı olabilir)." });
        }

        res.status(200).json({ mesaj: "Mail başarıyla güncellendi.", data });
    } catch (error) {
        console.error("PATCH GENEL HATASI:", error);
        res.status(500).json({ hata: "Mail güncellenemedi." });
    }
});

router.get('/emails/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: mail, error } = await supabase
            .from('mails')
            .select('id, sender, subject, date, isDel, isStarred, body, name')
            .eq('id', id)
            .eq('user_id', req.userId)
            .maybeSingle();

        if (error) console.error("SINGLE MAIL HATASI:", error);

        if (mail) {
            return res.json({
                id: mail.id,
                sender: mail.name,
                from: mail.sender,
                subject: mail.subject,
                date: mail.date,
                isDel: !!mail.isDel,
                isStarred: !!mail.isStarred,
                body: mail.body
            });
        }

        const { data: postedMail, error: postedErr } = await supabase
            .from('posted')
            .select('id, sender, receiver, subject, body, date, isDel, folder')
            .eq('id', id)
            .eq('user_id', req.userId)
            .maybeSingle();

        if (postedErr) console.error("SINGLE POSTED HATASI:", postedErr);

        if (postedMail) {
            return res.json({
                id: postedMail.id,
                from: postedMail.sender,
                to: postedMail.receiver,
                subject: postedMail.subject,
                body: postedMail.body,
                date: postedMail.date,
                isDel: !!postedMail.isDel,
                folder: postedMail.folder
            });
        }

        return res.status(404).json({ hata: "Mail bulunamadı!" });
    } catch (error) {
        console.error("EMAIL GET GENEL HATASI:", error);
        res.status(500).json({ hata: "Mail getirilirken hata oluştu." });
    }
});

router.delete('/emails/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('mails')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);

        if (error) {
            console.error("DELETE HATASI:", error);
            return res.status(500).json({ hata: "Mail silinemedi." });
        }

        res.status(200).json({ mesaj: "Mail başarıyla kalıcı olarak silindi." });
    } catch (error) {
        console.error("DELETE GENEL HATASI:", error);
        res.status(500).json({ hata: "Mail silinemedi." });
    }
});

router.get('/search', async (req, res) => {
    try {
        const rawQ = req.query.q || "";
        const q = rawQ.trim().toLowerCase();

        if (!q) {
            return res.status(200).json({ mails: [] });
        }

        const safeQ = q.replace(/[,()]/g, ' ').trim();
        if (!safeQ) {
            return res.status(200).json({ mails: [] });
        }

        const { data: mailsData, error: mailsError } = await supabase
            .from('mails')
            .select('id, sender, subject, date, isDel, isStarred, body, name')
            .eq('isDel', false)
            .eq('user_id', req.userId)
            .or(`subject.ilike.%${safeQ}%,sender.ilike.%${safeQ}%,name.ilike.%${safeQ}%,body.ilike.%${safeQ}%`);

        if (mailsError) {
            console.error("Mails arama hatası:", mailsError);
            return res.status(500).json({ message: "Arama yapılamadı." });
        }

        const { data: postedData, error: postedError } = await supabase
            .from('posted')
            .select('id, sender, receiver, subject, body, date, isDel, folder, isStarred')
            .eq('isDel', false)
            .eq('user_id', req.userId)
            .or(`subject.ilike.%${safeQ}%,sender.ilike.%${safeQ}%,receiver.ilike.%${safeQ}%,body.ilike.%${safeQ}%`);

        if (postedError) {
            console.error("Posted arama hatası:", postedError);
            return res.status(500).json({ message: "Arama yapılamadı." });
        }

        const formattedMails = (mailsData || []).map(m => ({
            id: m.id,
            sender: m.name,
            from: m.sender,
            subject: m.subject,
            date: m.date,
            isDel: !!m.isDel,
            isStarred: !!m.isStarred,
            body: m.body
        }));

        const formattedPosted = (postedData || []).map(p => ({
            id: p.id,
            from: p.sender,
            to: p.receiver,
            subject: p.subject,
            body: p.body,
            date: p.date,
            isDel: !!p.isDel,
            isStarred: !!p.isStarred,
            folder: p.folder || 'sent'
        }));

        const combinedResults = [...formattedMails, ...formattedPosted];

        combinedResults.sort((a, b) => {
            const getScore = (mail) => {
                let score = 0;
                const subject = (mail.subject || "").toLowerCase();
                const sender = (mail.from || "").toLowerCase();
                const body = (mail.body || "").toLowerCase();

                if (subject.includes(q)) score += 10;
                if (sender.includes(q)) score += 5;
                if (body.includes(q)) score += 10;

                return score;
            };

            const scoreA = getScore(a);
            const scoreB = getScore(b);

            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }

            return parseTurkishDate(b.date) - parseTurkishDate(a.date);
        });

        return res.status(200).json({ mails: combinedResults });

    } catch (error) {
        console.error("Arama catch hatası:", error);
        return res.status(400).json({ message: error.message });
    }
});

export default router;