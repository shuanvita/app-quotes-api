const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'quotes.json');

// Глобальная загрузка данных
let quotesCache = [];

// Инициализация при старте
async function loadQuotes() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        quotesCache = JSON.parse(data);
        console.log(`Загружено ${quotesCache.length} цитат`);
    } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        quotesCache = [];
    }
}

// Все цитаты с пагинацией и фильтрами (limit=10 по умолчанию)
app.get('/quotes', async (req, res) => {
    const { tags, author, limit = 10, page = 0 } = req.query;
    let filtered = [...quotesCache];

    // Фильтр по тегам (OR логика: love|friendship)
    if (tags) {
        const tagArray = tags.split('|');
        filtered = filtered.filter(q =>
            tagArray.some(tag => q.tags.includes(tag))
        );
    }

    // Фильтр по автору
    if (author) {
        filtered = filtered.filter(q => q.authorSlug === author);
    }

    const start = parseInt(page) * parseInt(limit);
    const result = filtered.slice(start, start + parseInt(limit));

    res.json({
        results: result,
        totalCount: filtered.length,
        limit: parseInt(limit),
        page: parseInt(page)
    });
});

// СЛУЧАЙНЫЕ цитаты (limit по умолчанию = 1)
app.get('/quotes/random', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 1, 150);
    const randomQuotes = Array.from({length: limit}, () =>
        quotesCache[Math.floor(Math.random() * quotesCache.length)]
    );
    res.json(randomQuotes.length > 1 ? randomQuotes : randomQuotes[0]);
});

// Цитата по ID
app.get('/quotes/:id', async (req, res) => {
    const quote = quotesCache.find(q => q._id === req.params.id);
    if (quote) res.json(quote);
    else res.status(404).json({ error: 'Quote not found' });
});

// Список тегов
app.get('/tags', async (req, res) => {
    const tags = [...new Set(quotesCache.flatMap(q => q.tags))];
    res.json(tags);
});

// 404 для несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

loadQuotes().then(() => {
    app.listen(PORT, () => {
        console.log(`Quotes API на http://localhost:${PORT}`);
        console.log(`Все цитаты: http://localhost:${PORT}/quotes`);
        console.log(`Случайная: http://localhost:${PORT}/quotes/random`);
    });
});
