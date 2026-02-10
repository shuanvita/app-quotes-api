import db from './db.js';

export function setupRoutes(app) {

    // GET /quotes/random - случайная цитата
    app.get('/quotes/random', async (request, reply) => {
        const { limit = 1, tags, author, maxLength, minLength } = request.query;

        let query = `
      SELECT q.id, q.content, a.name as author, a.slug as authorSlug, q.length,
             GROUP_CONCAT(t.name) as tags
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE 1=1
    `;

        const params = [];

        if (minLength) {
            query += ` AND q.length >= ?`;
            params.push(minLength);
        }

        if (maxLength) {
            query += ` AND q.length <= ?`;
            params.push(maxLength);
        }

        if (author) {
            query += ` AND a.slug = ?`;
            params.push(author);
        }

        query += ` GROUP BY q.id ORDER BY RANDOM() LIMIT ?`;
        params.push(parseInt(limit));

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        const formatted = results.map(r => ({
            ...r,
            tags: r.tags ? r.tags.split(',') : []
        }));

        return limit == 1 ? formatted[0] : formatted;
    });

    // GET /quotes - список цитат
    app.get('/quotes', async (request, reply) => {
        const { page = 1, limit = 20, author, tags } = request.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT q.id, q.content, a.name as author, a.slug as authorSlug, q.length,
             GROUP_CONCAT(t.name) as tags
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE 1=1
    `;

        const params = [];

        if (author) {
            query += ` AND a.slug = ?`;
            params.push(author);
        }

        query += ` GROUP BY q.id LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        const countStmt = db.prepare('SELECT COUNT(*) as count FROM quotes');
        const { count } = countStmt.get();

        return {
            count: results.length,
            totalCount: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            results: results.map(r => ({
                ...r,
                tags: r.tags ? r.tags.split(',') : []
            }))
        };
    });

    // GET /quotes/:id - цитата по ID
    app.get('/quotes/:id', async (request, reply) => {
        const { id } = request.params;

        const stmt = db.prepare(`
      SELECT q.id, q.content, a.name as author, a.slug as authorSlug, q.length,
             GROUP_CONCAT(t.name) as tags
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE q.id = ?
      GROUP BY q.id
    `);

        const result = stmt.get(id);

        if (!result) {
            return reply.status(404).send({ error: 'Quote not found' });
        }

        return {
            ...result,
            tags: result.tags ? result.tags.split(',') : []
        };
    });

    // GET /authors - список авторов
    app.get('/authors', async (request, reply) => {
        const { page = 1, limit = 20 } = request.query;
        const offset = (page - 1) * limit;

        const stmt = db.prepare('SELECT * FROM authors LIMIT ? OFFSET ?');
        const results = stmt.all(parseInt(limit), offset);

        const countStmt = db.prepare('SELECT COUNT(*) as count FROM authors');
        const { count } = countStmt.get();

        return {
            count: results.length,
            totalCount: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            results
        };
    });

    // GET /tags - список тегов
    app.get('/tags', async (request, reply) => {
        const stmt = db.prepare('SELECT * FROM tags ORDER BY name');
        const results = stmt.all();

        return {
            count: results.length,
            results
        };
    });

    // Health check
    app.get('/health', async () => ({ status: 'ok' }));
}