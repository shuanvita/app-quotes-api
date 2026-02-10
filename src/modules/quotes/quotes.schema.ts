import { z } from 'zod';

export const randomQuotesParamsSchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(1),
    maxLength: z.coerce.number().optional(),
    minLength: z.coerce.number().optional(),
    tags: z.string().optional(),
    author: z.string().optional(),
});

export const listQuotesParamsSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(150).default(20),
    maxLength: z.coerce.number().optional(),
    minLength: z.coerce.number().optional(),
    tags: z.string().optional(),
    author: z.string().optional(),
    sortBy: z.enum(['dateAdded', 'dateModified', 'author', 'content']).default('dateAdded'),
    order: z.enum(['asc', 'desc']).optional(),
});

export const searchQuotesParamsSchema = z.object({
    query: z.string().min(1),
    fields: z.string().default('content,author,tags'),
    fuzzyMaxEdits: z.coerce.number().min(0).max(2).default(0),
    fuzzyMaxExpansions: z.coerce.number().min(0).max(150).default(50),
    limit: z.coerce.number().min(1).max(150).default(20),
    page: z.coerce.number().min(1).default(1),
});

export type RandomQuotesParams = z.infer<typeof randomQuotesParamsSchema>;
export type ListQuotesParams = z.infer<typeof listQuotesParamsSchema>;
export type SearchQuotesParams = z.infer<typeof searchQuotesParamsSchema>;