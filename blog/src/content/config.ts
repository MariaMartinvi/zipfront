import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    // Campos adicionales para el blog (slug lo genera Astro, no se pone en el schema)
    excerpt: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    featuredImage: z.string().optional(),
    urlSlug: z.string().optional(), // Para EN: mismo slug que ES en la URL (ej. rutina-cuentos-dormir)
  }),
});

export const collections = { blog };
