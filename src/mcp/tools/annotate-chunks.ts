import { z } from 'zod';
import {
  CategorySchema,
  LabelSchema,
  FeeScheduleSubtypeSchema,
  FootnotesSubtypeSchema,
} from '../../types/annotation.types.js';
import { batchProcessor } from '../../annotation/batch-processor.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('annotate-chunks');

// Single annotation item schema (without sessionId)
const AnnotationItemSchema = z.object({
  chunkId: z.string().min(1),
  categories: z.array(CategorySchema).optional(),
  labels: z.array(LabelSchema).optional(),
  subtypes: z
    .record(
      CategorySchema,
      z.union([FeeScheduleSubtypeSchema, FootnotesSubtypeSchema])
    )
    .optional(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
});

// Input schema for annotate_chunks tool
export const AnnotateChunksInputSchema = z.object({
  sessionId: z.string().uuid(),
  annotations: z.array(AnnotationItemSchema).min(1),
});

export type AnnotateChunksInput = z.infer<typeof AnnotateChunksInputSchema>;

// Tool definition for MCP
export const annotateChunksToolDefinition = {
  name: 'annotate_chunks',
  description: 'Annotate multiple chunks in a single call (partial success semantics)',
  inputSchema: toJsonSchema(AnnotateChunksInputSchema, 'AnnotateChunksInput'),
};

// Tool handler
export function handleAnnotateChunks(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = AnnotateChunksInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for annotate_chunks');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'ValidationError',
            message: 'Invalid input parameters',
            issues: parseResult.error.issues,
          }),
        },
      ],
      isError: true,
    };
  }

  const input = parseResult.data;

  // Process batch annotations
  const result = batchProcessor.annotateChunks({
    sessionId: input.sessionId,
    annotations: input.annotations.map((a) => ({
      chunkId: a.chunkId,
      categories: a.categories,
      labels: a.labels,
      subtypes: a.subtypes as Record<string, string> | undefined,
      keywords: a.keywords,
      tags: a.tags,
      notes: a.notes,
      summary: a.summary,
    })),
  });

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'annotate_chunks took longer than 100ms');
  }

  // Batch processor always succeeds (partial success semantics)
  const data = result.data;
  logger.info(
    { sessionId: input.sessionId, successCount: data.successCount, errorCount: data.errorCount },
    'Batch annotation completed'
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
  };
}
