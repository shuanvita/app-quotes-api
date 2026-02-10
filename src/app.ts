import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { quotesRoutes } from './modules/quotes/quotes.routes';
import rateLimitPlugin from './plugins/rate-limit';

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        },
    });

    // Регистрируем плагины
    await app.register(cors);
    await app.register(rateLimitPlugin);

    // Swagger документация
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Quotable API',
                description: 'Random Quotes API - Modern Clone',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server',
                },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
    });

    // Регистрируем роуты
    await app.register(quotesRoutes);

    // Health check
    app.get('/health', async () => ({ status: 'ok' }));

    return app;
}