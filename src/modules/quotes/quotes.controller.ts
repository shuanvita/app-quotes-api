import type { FastifyRequest, FastifyReply } from 'fastify';
import { QuotesService } from './quotes.service';
import { randomQuotesParamsSchema, listQuotesParamsSchema } from './quotes.schema';

const quotesService = new QuotesService();

export async function getRandomQuotes(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const params = randomQuotesParamsSchema.parse(request.query);
    const result = await quotesService.getRandomQuotes(params);
    return reply.send(result);
}

export async function listQuotes(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const params = listQuotesParamsSchema.parse(request.query);
    const result = await quotesService.listQuotes(params);
    return reply.send(result);
}

export async function getQuoteById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const result = await quotesService.getQuoteById(id);

    if (!result) {
        return reply.status(404).send({ error: 'Quote not found' });
    }

    return reply.send(result);
}