import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { quoteTags } from './quotes';

export const tags = pgTable('tags', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    quoteCount: integer('quote_count').default(0),
});

export const tagsRelations = relations(tags, ({ many }) => ({
    quoteTags: many(quoteTags),
}));