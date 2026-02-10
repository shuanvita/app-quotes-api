import { db } from '../../config/database';
import { quotes, authors, quoteTags, tags } from '../../db/schema';
import { eq, and, gte, lte, sql, inArray, count } from 'drizzle-orm';
import type { RandomQuotesParams, ListQuotesParams } from './quotes.schema';

export class QuotesService {
    async getRandomQuotes(params: RandomQuotesParams) {
        let query = db
            .select({
                id: quotes.id,
                content: quotes.content,
                author: authors.name,
                authorSlug: authors.slug,
                length: quotes.length,
                tags: sql<string[]>`ARRAY_AGG(${tags.name})`,
            })
            .from(quotes)
            .leftJoin(authors, eq(quotes.authorId, authors.id))
            .leftJoin(quoteTags, eq(quotes.id, quoteTags.quoteId))
            .leftJoin(tags, eq(quoteTags.tagId, tags.id))
            .groupBy(quotes.id, authors.name, authors.slug)
            .orderBy(sql`RANDOM()`)
            .limit(params.limit);

        // Применяем фильтры
        const conditions = [];

        if (params.minLength) {
            conditions.push(gte(quotes.length, params.minLength));
        }

        if (params.maxLength) {
            conditions.push(lte(quotes.length, params.maxLength));
        }

        if (params.author) {
            conditions.push(eq(authors.slug, params.author));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
        }

        const results = await query;

        return params.limit === 1 ? results[0] : results;
    }

    async listQuotes(params: ListQuotesParams) {
        const offset = (params.page - 1) * params.limit;

        const conditions = [];

        if (params.minLength) {
            conditions.push(gte(quotes.length, params.minLength));
        }

        if (params.maxLength) {
            conditions.push(lte(quotes.length, params.maxLength));
        }

        if (params.author) {
            conditions.push(eq(authors.slug, params.author));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [results, totalCountResult] = await Promise.all([
            db
                .select({
                    id: quotes.id,
                    content: quotes.content,
                    author: authors.name,
                    authorSlug: authors.slug,
                    length: quotes.length,
                    tags: sql<string[]>`ARRAY_AGG(${tags.name})`,
                })
                .from(quotes)
                .leftJoin(authors, eq(quotes.authorId, authors.id))
                .leftJoin(quoteTags, eq(quotes.id, quoteTags.quoteId))
                .leftJoin(tags, eq(quoteTags.tagId, tags.id))
                .where(whereClause)
                .groupBy(quotes.id, authors.name, authors.slug)
                .limit(params.limit)
                .offset(offset),

            db
                .select({ count: count() })
                .from(quotes)
                .leftJoin(authors, eq(quotes.authorId, authors.id))
                .where(whereClause)
        ]);

        const totalCount = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / params.limit);

        return {
            count: results.length,
            totalCount,
            page: params.page,
            totalPages,
            lastItemIndex: offset + results.length,
            results,
        };
    }

    async getQuoteById(id: string) {
        const result = await db
            .select({
                id: quotes.id,
                content: quotes.content,
                author: authors.name,
                authorSlug: authors.slug,
                length: quotes.length,
                tags: sql<string[]>`ARRAY_AGG(${tags.name})`,
            })
            .from(quotes)
            .leftJoin(authors, eq(quotes.authorId, authors.id))
            .leftJoin(quoteTags, eq(quotes.id, quoteTags.quoteId))
            .leftJoin(tags, eq(quoteTags.tagId, tags.id))
            .where(eq(quotes.id, id))
            .groupBy(quotes.id, authors.name, authors.slug)
            .limit(1);

        return result[0] || null;
    }
}