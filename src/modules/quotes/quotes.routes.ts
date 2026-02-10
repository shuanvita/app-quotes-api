import type { FastifyInstance } from 'fastify';
import * as quotesController from './quotes.controller';

export async function quotesRoutes(app: FastifyInstance) {
    app.get('/quotes/random', quotesController.getRandomQuotes);
    app.get('/quotes', quotesController.listQuotes);
    app.get('/quotes/:id', quotesController.getQuoteById);
}