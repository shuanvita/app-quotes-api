import db from '../src/db.js';

// Добавляем авторов
const authors = [
    { name: 'Albert Einstein', slug: 'albert-einstein', bio: 'Theoretical physicist' },
    { name: 'Maya Angelou', slug: 'maya-angelou', bio: 'American poet' },
    { name: 'Steve Jobs', slug: 'steve-jobs', bio: 'Co-founder of Apple Inc.' },
];

const insertAuthor = db.prepare('INSERT INTO authors (name, slug, bio) VALUES (?, ?, ?)');
authors.forEach(a => {
    try {
        insertAuthor.run(a.name, a.slug, a.bio);
    } catch (e) {
        console.log(`Author ${a.name} already exists`);
    }
});

// Добавляем теги
const tags = ['wisdom', 'inspiration', 'technology', 'life'];
const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');
tags.forEach(tag => {
    try {
        insertTag.run(tag);
    } catch (e) {
        console.log(`Tag ${tag} already exists`);
    }
});

// Добавляем цитаты
const quotes = [
    {
        content: 'Imagination is more important than knowledge.',
        author: 'albert-einstein',
        tags: ['wisdom', 'inspiration']
    },
    {
        content: 'There is no greater agony than bearing an untold story inside you.',
        author: 'maya-angelou',
        tags: ['wisdom', 'life']
    },
    {
        content: 'Innovation distinguishes between a leader and a follower.',
        author: 'steve-jobs',
        tags: ['technology', 'inspiration']
    },
];

const getAuthor = db.prepare('SELECT id FROM authors WHERE slug = ?');
const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
const insertQuote = db.prepare('INSERT INTO quotes (content, author_id, length) VALUES (?, ?, ?)');
const insertQuoteTag = db.prepare('INSERT INTO quote_tags (quote_id, tag_id) VALUES (?, ?)');

quotes.forEach(q => {
    const author = getAuthor.get(q.author);
    const result = insertQuote.run(q.content, author.id, q.content.length);

    q.tags.forEach(tagName => {
        const tag = getTag.get(tagName);
        insertQuoteTag.run(result.lastInsertRowid, tag.id);
    });
});

console.log('✅ Database seeded!');