import express from 'express';
import { supabase } from '../../backend/supabaseClient.js';
import { parseTurkishDate } from '../utils/dateHelper.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool } from '../db.js';

const router = express.Router();

router.use(requireAuth);

const toTurkishDateString = (input) => {
    if (!input) {
        const now = new Date();
        return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    }
    if (typeof input === 'string' && /^\d{1,2}\.\d{1,2}\.\d{4}/.test(input)) {
        return input;
    }
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) {
        const now = new Date();
        return `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    }
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}.${month}.${year}`;
};

const getPostedHandler = async (req, res) => {
    try {
        const start = parseInt(req.query.start, 10) || 0;
        const end = parseInt(req.query.end, 10) || 32;

        const { count: postedCount, error: countError } = await supabase
            .from('posted')
            .select('*', { count: 'exact', head: true })
            .eq('isDel', false)
            .eq('user_id', req.userId);

        if (countError) return res.status(500).json({ hata: "Veriler alınamadı." });

        let posted = [];
        if (start < (postedCount || 0)) {
            const { data, error } = await supabase
                .from('posted')
                .select('id, sender, receiver, subject, body, date, isDel, folder, isStarred, starred_at')
                .eq('isDel', false)
                .eq('user_id', req.userId)
                .order('id', { ascending: false })
                .range(start, end);

            if (error) {
                console.error(error);
                return res.status(500).json({ hata: "Gönderilen mailler alınamadı." });
            }
            posted = data || [];
        }

        const formattedPosted = posted.map(p => ({
            id: p.id,
            from: p.sender,
            to: p.receiver,
            subject: p.subject,
            body: p.body,
            date: p.date,
            isDel: !!p.isDel,
            isStarred: !!p.isStarred,
            folder: p.folder,
            starredAt: p.starred_at
        })).sort((a, b) => parseTurkishDate(b.date) - parseTurkishDate(a.date));

        res.json({ mails: formattedPosted, totalMails: postedCount || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ hata: "Gönderilen mailler alınamadı." });
    }
};

const patchPostedHandler = async (req, res) => {
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
            .from('posted')
            .update(updates)
            .eq('id', String(id))
            .eq('user_id', req.userId)
            .select();

        if (error) {
            console.error(error);
            return res.status(500).json({ hata: "Mail güncellenemedi." });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ hata: "Güncellenecek mail bulunamadı (ID eşleşmedi)." });
        }
        res.status(200).json({ mesaj: "Mail başarıyla güncellendi.", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ hata: "Mail güncellenemedi." });
    }
};

const postMailHandler = async (req, res) => {
    const { id, from, to, subject, body, date, isDel, folder } = req.body;
    const senderId = req.userId;

    try {
        const normalizedDate = toTurkishDateString(date);

        const { error } = await supabase
            .from('posted')
            .insert([
                { id, sender: from, receiver: to, subject, body, date: normalizedDate, isDel: !!isDel, folder, user_id: senderId }
            ]);

        if (error) {
            console.error("Supabase Hatası:", error);
            return res.status(500).json({ hata: "Mail kaydedilemedi." });
        }

        // Alıcı sistemde kayıtlı bir kullanıcıysa, gelen kutusuna da düşür
        try {
            const { rows: recipientRows } = await pool.query(
                'SELECT id, name FROM "user" WHERE email = $1',
                [to]
            );

            if (recipientRows.length > 0) {
                const recipient = recipientRows[0];

                const { rows: senderRows } = await pool.query(
                    'SELECT name FROM "user" WHERE id = $1',
                    [senderId]
                );
                const senderName = senderRows[0]?.name || from;

                const { error: deliverError } = await supabase.from('mails').insert([{
                    sender: from,
                    name: senderName,
                    subject,
                    body,
                    date: normalizedDate,
                    received_at: new Date().toISOString(),
                    isDel: false,
                    isStarred: false,
                    user_id: recipient.id,
                }]);

                if (deliverError) {
                    console.error("Gelen kutusuna teslimat hatası:", deliverError);
                }
            }
        } catch (deliveryErr) {
            console.error("Alıcı arama/teslimat hatası:", deliveryErr);
            // gönderim işlemini bozma, sadece logla
        }

        res.status(201).json({
            mesaj: "Mail kaydedildi.",
            mail: { ...req.body, date: normalizedDate }
        });
    } catch (error) {
        console.error("Mail Kaydetme Hatası:", error);
        res.status(500).json({ hata: "Mail kaydedilemedi." });
    }
};

const deletePostedHandler = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('posted')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);
        if (error) return res.status(500).json({ hata: "Mail silinemedi." });
        res.status(200).json({ mesaj: "Mail başarıyla silindi." });
    } catch (error) {
        res.status(500).json({ hata: "Mail silinemedi." });
    }
};

const getSinglePostedHandler = async (req, res) => {
    const requestedId = req.params.id;
    try {
        const { data: post, error } = await supabase
            .from('posted')
            .select('id, sender, receiver, subject, body, date, isDel, folder, isStarred')
            .eq('id', requestedId)
            .eq('user_id', req.userId)
            .maybeSingle();

        if (error) return res.status(500).json({ hata: "Mail alınamadı." });
        if (!post) return res.status(404).json({ message: "Post bulunamadı!" });

        res.json({
            id: post.id,
            from: post.sender,
            to: post.receiver,
            subject: post.subject,
            body: post.body,
            date: post.date,
            isDel: !!post.isDel,
            isStarred: !!post.isStarred,
            folder: post.folder
        });
    } catch (error) {
        res.status(500).json({ hata: "Sunucu hatası." });
    }
};

const getTrashHandler = async (req, res) => {
    try {
        const start = parseInt(req.query.start, 10) || 0;
        const end = parseInt(req.query.end, 10) || 31;

        const { data: deletedMails, error: mailsError } = await supabase
            .from('mails')
            .select('*')
            .eq('isDel', true)
            .eq('user_id', req.userId);

        if (mailsError) console.error("Çöp kutusu (Gelen) hatası:", mailsError);

        const formattedEmails = (deletedMails || []).map(e => ({
            id: e.id,
            from: e.from || e.sender,
            to: e.to || e.receiver,
            subject: e.subject,
            body: e.body,
            date: e.date,
            isDel: !!e.isDel,
            isStarred: !!e.isStarred,
            folder: e.folder || 'inbox',
            deletedAt: e.deleted_at
        }));

        const { data: deletedPosted, error: postedError } = await supabase
            .from('posted')
            .select('*')
            .eq('isDel', true)
            .eq('user_id', req.userId);

        if (postedError) console.error("Çöp kutusu (Gönderilen) hatası:", postedError);

        const formattedPosted = (deletedPosted || []).map(p => ({
            id: p.id,
            from: p.sender,
            to: p.receiver,
            subject: p.subject,
            body: p.body,
            date: p.date,
            isDel: !!p.isDel,
            isStarred: !!p.isStarred,
            folder: p.folder || 'sent',
            deletedAt: p.deleted_at
        }));

        const getSortTime = (mail) =>
            mail.deletedAt ? new Date(mail.deletedAt).getTime() : parseTurkishDate(mail.date);

        const allTrashMails = [...formattedEmails, ...formattedPosted];
        allTrashMails.sort((a, b) => getSortTime(b) - getSortTime(a));

        const paginatedMails = allTrashMails.slice(start, end + 1);

        res.json({ mails: paginatedMails, totalMails: allTrashMails.length });
    } catch (error) {
        console.error("Çöp kutusu genel hata:", error);
        res.status(500).json({ hata: "Sunucu hatası." });
    }
};

router.get('/posted/:id', getSinglePostedHandler);
router.get('/posted', getPostedHandler);
router.get('/api/posted', getPostedHandler);
router.post('/api/posted', postMailHandler);
router.post('/posted', postMailHandler);
router.patch('/api/posted/:id', patchPostedHandler);
router.patch('/posted/:id', patchPostedHandler);
router.delete('/api/posted/:id', deletePostedHandler);
router.delete('/posted/:id', deletePostedHandler);
router.get('/api/trash', getTrashHandler);

export default router;