import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

interface Quote {
    _id: string;
    content: string;
    author: string;
    tags: string[];
    authorSlug: string;
    length: number;
    dateAdded: string;
    dateModified?: string;
}

interface DbData {
    quotes: Quote[];
}

// ✅ ЧИТАЕМ JSON ФАЙЛ
async function loadQuotes(): Promise<Quote[]> {
    try {
        const data = await fs.readFile('data/quotes.json', 'utf-8');
        const parsed = JSON.parse(data);

        // 🔥 ПОДДЕРЖКА ЛЮБОГО ФОРМАТА
        if (Array.isArray(parsed)) {
            console.log(`📊 ✅ Загружен массив: ${parsed.length} цитат`);
            return parsed as Quote[];
        } else if (parsed.quotes && Array.isArray(parsed.quotes)) {
            console.log(`📊 ✅ Загружен объект.quotes: ${parsed.quotes.length} цитат`);
            return parsed.quotes as Quote[];
        }

        console.log('❌ Неизвестный формат JSON');
        return [];
    } catch (error) {
        console.log('⚠️ Файл data/quotes.json не найден');
        return [];
    }
}

const randomQuerySchema = z.object({
    tags: z.string().optional(),
    author: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(1),
});

const quotesQuerySchema = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    skip: z.coerce.number().min(0).optional().default(0),
    tags: z.string().optional(),
    author: z.string().optional(),
});

const app = express();
app.use(cors());
app.use(express.json({ strict: false }));

const validateQuery = (schema: z.ZodObject<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            res.status(400).json({ error: 'Invalid query parameters' });
        }
    };
};

// 🔥 /random - ТОЧНАЯ КОПИЯ QUOTABLE.IO
app.get('/random', validateQuery(randomQuerySchema), async (req: Request, res: Response) => {
    const quotes = await loadQuotes();
    const { tags, author, limit } = req.query as any;

    let filteredQuotes: Quote[] = quotes;

    // Фильтр по тегам
    if (tags) {
        const tagArray = (tags as string).split(',').map(t => t.trim().toLowerCase());
        filteredQuotes = filteredQuotes.filter(q =>
            q.tags.some(t => tagArray.includes(t.toLowerCase()))
        );
    }

    // Фильтр по автору
    if (author) {
        filteredQuotes = filteredQuotes.filter(q =>
            q.author.toLowerCase().includes((author as string).toLowerCase())
        );
    }

    // РАНДОМ (точно как оригинал)
    const randomQuotes = filteredQuotes
        .map(q => ({ ...q, sortIndex: Math.random() }))
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .slice(0, limit)
        .map(({ sortIndex, ...q }) => q);

    res.json(randomQuotes);
});

// 🔥 /quotes - ПАГИНАЦИЯ
app.get('/quotes', validateQuery(quotesQuerySchema), async (req: Request, res: Response) => {
    console.log('🔍 /quotes query:', req.query); // DEBUG

    const quotes = await loadQuotes();
    const { page, limit, skip, tags, author } = req.query as any;

    let filteredQuotes: Quote[] = quotes;

    // Фильтры (если есть)
    if (tags) {
        const tagArray = (tags as string).split(',').map(t => t.trim().toLowerCase());
        filteredQuotes = filteredQuotes.filter(q =>
            q.tags.some(t => tagArray.includes(t.toLowerCase()))
        );
    }

    if (author) {
        filteredQuotes = filteredQuotes.filter(q =>
            q.author.toLowerCase().includes((author as string).toLowerCase())
        );
    }

    const totalCount = filteredQuotes.length;

    // ✅ ПРАВИЛЬНАЯ ПАГИНАЦИЯ
    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 20;
    const currentSkip = Number(skip) || (currentPage - 1) * currentLimit;

    console.log('📊 Пагинация:', { currentPage, currentLimit, currentSkip, totalCount });

    const paginatedQuotes = filteredQuotes.slice(currentSkip, currentSkip + currentLimit);

    res.json({
        count: paginatedQuotes.length,
        totalCount,
        lastItemIndex: Math.min(currentSkip + paginatedQuotes.length, totalCount),
        results: paginatedQuotes
    });
});

// 🔥 /tags
app.get('/tags', async (req: Request, res: Response) => {
    const quotes = await loadQuotes();
    const allTags = Array.from(new Set(quotes.flatMap(q => q.tags)))
        .map(tag => tag.toLowerCase())
        .sort();

    const tags = allTags.map(tag => ({
        _id: tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        quoteCount: quotes.filter(q => q.tags.includes(tag)).length
    }));

    res.json({ results: tags });
});

// 🔥 /authors
app.get('/authors', async (req: Request, res: Response) => {
    const quotes = await loadQuotes();
    const authorsMap = new Map<string, number>();

    quotes.forEach(q => {
        authorsMap.set(q.author, (authorsMap.get(q.author) || 0) + 1);
    });

    const authors = Array.from(authorsMap.entries())
        .map(([author, quoteCount]) => ({
            _id: author.toLowerCase().replace(/\s+/g, '-'),
            name: author,
            quoteCount,
            slug: author.toLowerCase().replace(/\s+/g, '-')
        }))
        .sort((a, b) => b.quoteCount - a.quoteCount);

    res.json({ results: authors });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ✅ QUOTABLE.IO API РАБОТАЕТ! http://localhost:${PORT}`);
    console.log(`📱 Тест 1: http://localhost:${PORT}/random?tags=love&limit=1`);
    console.log(`📱 Тест 2: http://localhost:${PORT}/quotes?page=1&limit=5`);
});
