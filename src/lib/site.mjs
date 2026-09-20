export const SITE = {
  name: 'Field Notes',
  tagline: 'A small static library for building static sites with Astro.',
  description:
    'Field Notes is a static knowledge site built with Astro content collections. It includes nested article routes, category filters, local assets and a fully client-side search.',
  version: '1.0.0',
};

export const CATEGORIES = {
  guides: {
    slug: 'guides',
    label: 'Guides',
    description: 'Step-by-step walkthroughs of Astro fundamentals.',
  },
  recipes: {
    slug: 'recipes',
    label: 'Recipes',
    description: 'Small, reusable patterns and techniques.',
  },
  reference: {
    slug: 'reference',
    label: 'Reference',
    description: 'Commands, schemas and checklists at a glance.',
  },
};

export function categoryLabel(slug) {
  return CATEGORIES[slug]?.label ?? slug;
}

export function categoryMeta(slug) {
  return CATEGORIES[slug] ?? CATEGORIES.guides;
}