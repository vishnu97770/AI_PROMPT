import { z } from "zod";

// ─── Generate ─────────────────────────────────────────────────────────────────

/** Query params for GET /api/generate/stream */
export const generateQuerySchema = z.object({
  userInput:    z.string().min(3, "Prompt must be at least 3 characters").max(2000),
  categorySlug: z.string().min(1, "Category is required"),
  fresh:        z.coerce.boolean().optional().default(false),
});

/** Body for POST /api/generate */
export const generateBodySchema = z.object({
  userInput:    z.string().min(3).max(2000),
  categorySlug: z.string().min(1),
  hasImage:     z.boolean().optional().default(false),
  fresh:        z.boolean().optional().default(false),
});

// ─── Prompts list ─────────────────────────────────────────────────────────────

export const promptListQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  search:   z.string().max(200).optional(),
  sort:     z.enum(["newest", "oldest", "copyCount", "qualityScore"]).default("newest"),
});

// ─── Prompt update ────────────────────────────────────────────────────────────

export const promptUpdateSchema = z.object({
  isPublic: z.boolean().optional(),
}).strict(); // disallow any other fields

// ─── Types inferred from schemas ──────────────────────────────────────────────

export type GenerateQuery  = z.infer<typeof generateQuerySchema>;
export type GenerateBody   = z.infer<typeof generateBodySchema>;
export type PromptListQuery = z.infer<typeof promptListQuerySchema>;
export type PromptUpdate   = z.infer<typeof promptUpdateSchema>;
