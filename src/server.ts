import 'dotenv/config';
import { buildApp } from './app';
import { redis } from './config/redis';

const PORT = parseInt(process.env.PORT || '3000');

async function start() {
    try {
        // Подключаемся к Redis
        await redis.connect();

        const app = await buildApp();

        await app.listen({ port: PORT, host: '0.0.0.0' });

        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Docs available at http://localhost:${PORT}/docs`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

start();