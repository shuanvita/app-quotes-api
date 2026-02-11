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
// СЛУЧАЙНЫЕ цитаты с ПОЛНЫМИ фильтрами
app.get('/quotes/random', async (req, res) => {
    try {
        const {
            limit = 9,           // количество цитат
            minLength = 0,       // мин. длина текста
            maxLength = 150,     // макс. длина текста
            tags,                // теги (через | : "love|friendship")
            author,              // имя автора
            authorId,            // ID автора
        } = req.query;

        let filtered = [...quotesCache];

        // Фильтр по минимальной длине
        const minLen = parseInt(minLength);
        if (minLen > 0) {
            filtered = filtered.filter(q => q.content.length >= minLen);
        }

        // Фильтр по максимальной длине
        const maxLen = parseInt(maxLength);
        if (maxLen < 10000) {
            filtered = filtered.filter(q => q.content.length <= maxLen);
        }

        // Фильтр по тегам (OR логика)
        if (tags) {
            const tagArray = tags.split('|').map(t => t.toLowerCase());
            filtered = filtered.filter(q =>
                tagArray.some(tag => q.tags.some(t => t.toLowerCase() === tag))
            );
        }

        // Фильтр по имени автора
        if (author) {
            filtered = filtered.filter(q =>
                q.author.toLowerCase().includes(author.toLowerCase())
            );
        }

        // Фильтр по ID автора
        if (authorId) {
            filtered = filtered.filter(q => q.authorSlug === authorId);
        }

        // Проверка на пустой результат
        if (filtered.length === 0) {
            return res.status(404).json({
                error: 'Цитаты не найдены по заданным фильтрам'
            });
        }

        // Генерация случайных цитат
        const limitNum = Math.min(parseInt(limit), 150);
        const randomQuotes = Array.from({ length: limitNum }, () =>
            filtered[Math.floor(Math.random() * filtered.length)]
        );

        // Возврат одной цитаты (если limit=1) или массива
        res.json(randomQuotes.length === 1 ? randomQuotes[0] : randomQuotes);

    } catch (err) {
        console.error('Ошибка /quotes/random:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
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
