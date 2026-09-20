import { getCollection } from 'astro:content';
import { categoryLabel } from './site.mjs';

export function stripMarkdown(md) {
  return String(md ?? '')
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/`{3}[\s\S]*?`{3}|`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^[>\-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/[*_~`>#|]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function articleItem(entry) {
  return {
    slug: entry.id ?? entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    category: entry.data.category,
    categoryLabel: categoryLabel(entry.data.category),
    tags: entry.data.tags ?? [],
    date: entry.data.date.toISOString(),
    bodyText: stripMarkdown(entry.body ?? ''),
  };
}

export async function listArticles() {
  const entries = await getCollection('articles');
  return entries
    .filter((entry) => !entry.data.draft)
    .map(articleItem)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function articlesByCategory(category) {
  const all = await listArticles();
  return all.filter((a) => a.category === category);
}