import Fastify from 'fastify';
import cors from '@fastify/cors';
import { setupRoutes } from './routes.js';
import 'dotenv/config';

const app = Fastify({
    logger: true
});

// CORS
await app.register(cors);

// Routes
setupRoutes(app);

const PORT = process.env.PORT || 3000;

try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${PORT}`);
} catch (err) {
    app.log.error(err);
    process.exit(1);
}