import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import emailRoutes from './routes/emails.js';
import postedRoutes from './routes/posted.js';
import meRoutes from './routes/me.js';

process.on('uncaughtException', (err) => {
    console.error('🔥 KRİTİK HATA (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 KRİTİK HATA (Unhandled Rejection):', reason);
});

const app = express();
const port = 3001;

app.use(cors({
    origin: "https://gmail-clone-omega-three.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use('/api', meRoutes);
app.use('/api', emailRoutes);
app.use('/', postedRoutes);

const server = app.listen(port, () => {
    console.log(`Server çalışıyor ip: http://localhost:${port} 🏆`);
});