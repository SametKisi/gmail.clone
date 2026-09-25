import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool } from '../db.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, email, name FROM "user" WHERE id = $1',
            [req.userId]
        );
        if (rows.length === 0) {
            return res.status(401).json({ hata: 'Kullanıcı bulunamadı.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('[/me] Hata:', err.message);
        return res.status(500).json({ hata: 'Sunucu hatası.' });
    }
});

export default router;