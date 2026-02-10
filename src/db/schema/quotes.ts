import { pgTable, uuid, text, integer, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { authors } from './authors';
import { tags } from './tags';

export const quotes = pgTable('quotes', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    authorId: uuid('author_id').references(() => authors.id),
    length: integer('length').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const quotesRelations = relations(quotes, ({ one, many }) => ({
    author: one(authors, {
        fields: [quotes.authorId],
        references: [authors.id],
    }),
    quoteTags: many(quoteTags),
}));

export const quoteTags = pgTable('quote_tags', {
    quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.quoteId, table.tagId] }),
}));