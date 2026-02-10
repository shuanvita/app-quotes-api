import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { quotes } from './quotes';

export const authors = pgTable('authors', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    bio: text('bio'),
    description: text('description'),
    link: varchar('link', { length: 500 }),
    quoteCount: integer('quote_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const authorsRelations = relations(authors, ({ many }) => ({
    quotes: many(quotes),
}));