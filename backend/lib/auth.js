import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const authPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export const auth = betterAuth({
    database: authPool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
    

    emailAndPassword: {
        enabled: true,
    },

    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
    },

    trustedOrigins: [
        'http://localhost:5173',
        'https://gmail-clone-omega-three.vercel.app'
    ],

    plugins: [
        bearer(),
    ],
});