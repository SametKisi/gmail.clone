import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { pool } from '../db.js';

// auth.jsdeki session.updateAge, session.expiresIn ile birebir aynı olmalı
const UPDATE_AGE_SECONDS = 60 * 60 * 24;        // 1 gün
const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;   // 30 gün

export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                hata: 'Yetkilendirme başlığı eksik.',
                code: 'NO_TOKEN',
            });
        }

        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

        if (!session) {
            return res.status(401).json({
                hata: 'Oturum bulunamadı veya süresi dolmuş.',
                code: 'SESSION_INVALID',
            });
        }

        const updatedAt = new Date(session.session.updatedAt).getTime();
        const secondsSinceUpdate = (Date.now() - updatedAt) / 1000;

        if (secondsSinceUpdate >= UPDATE_AGE_SECONDS) {
            const newExpiresAt = new Date(Date.now() + EXPIRES_IN_SECONDS * 1000);
            pool.query
            (
                'UPDATE session SET "expiresAt" = $1, "updatedAt" = now() WHERE id = $2',
                [newExpiresAt, session.session.id]
            ).catch((err) => console.error('[requireAuth] manuel session refresh hatası:', err.message));
        }

        req.userId = session.user.id;
        req.user = session.user;
        next();
    } catch (err) {
        console.error('[requireAuth] Hata:', err.message);
        return res.status(401).json({ hata: 'Geçersiz veya süresi dolmuş token.' });
    }
}