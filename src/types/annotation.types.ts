import { z } from 'zod';

// Literal Types

export const CategorySchema = z.enum(['fee_schedule', 'footnotes']);
export type Category = z.infer<typeof CategorySchema>;

export const LabelSchema = z.enum(['Fee Schedule', 'Footnotes']);
export type Label = z.infer<typeof LabelSchema>;

export const FeeScheduleSubtypeSchema = z.enum([
  'participant_fee',
  'legal_regulatory_fee',
  'port_fees_and_other_services',
  'market_data_fees',
  'fees_and_rebates',
]);
export type FeeScheduleSubtype = z.infer<typeof FeeScheduleSubtypeSchema>;

export const FootnotesSubtypeSchema = z.enum(['reference']);
export type FootnotesSubtype = z.infer<typeof FootnotesSubtypeSchema>;

export const SubtypeSchema = z.union([FeeScheduleSubtypeSchema, FootnotesSubtypeSchema]);
export type Subtype = z.infer<typeof SubtypeSchema>;

export const RelationTypeSchema = z.enum(['dependencies', 'footnotes', 'references']);
export type RelationType = z.infer<typeof RelationTypeSchema>;

// Chunk Annotation Schema

export const ChunkAnnotationSchema = z.object({
  chunk_id: z.string().describe('Format: {position}_{category}_{label}'),
  position: z.number().int().nonnegative(),
  categories: z.array(CategorySchema).default([]),
  labels: z.array(LabelSchema).default([]),
  subtypes: z.record(CategorySchema, SubtypeSchema).default({}),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  relations: z.record(RelationTypeSchema, z.array(z.string())).default({}),
  notes: z.string().default(''),
  summary: z.string().default(''),
});
export type ChunkAnnotation = z.infer<typeof ChunkAnnotationSchema>;

// Annotation Export Schema

export const AnnotationExportSchema = z.object({
  chunks: z.array(ChunkAnnotationSchema),
});
export type AnnotationExport = z.infer<typeof AnnotationExportSchema>;

// Batch Annotation Result Schemas

export const AnnotationItemResultSchema = z.object({
  chunkId: z.string(),
  success: z.boolean(),
  data: ChunkAnnotationSchema.optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
    })
    .optional(),
});
export type AnnotationItemResult = z.infer<typeof AnnotationItemResultSchema>;

export const BatchAnnotationResultSchema = z.object({
  results: z.array(AnnotationItemResultSchema),
  successCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
});
export type BatchAnnotationResult = z.infer<typeof BatchAnnotationResultSchema>;
