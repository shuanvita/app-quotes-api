import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../config/redis';

export default fp(async (fastify) => {
    await fastify.register(rateLimit, {
        global: true,
        max: parseInt(process.env.RATE_LIMIT_MAX || '180'),
        timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
        redis,
        errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Maximum 180 requests per minute.',
        }),
    });
});