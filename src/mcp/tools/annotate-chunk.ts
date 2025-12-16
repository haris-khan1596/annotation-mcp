import { z } from 'zod';
import {
  CategorySchema,
  LabelSchema,
  FeeScheduleSubtypeSchema,
  FootnotesSubtypeSchema,
} from '../../types/annotation.types.js';
import { annotationService } from '../../annotation/annotation-service.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('annotate-chunk');

// Input schema for annotate_chunk tool
export const AnnotateChunkInputSchema = z.object({
  sessionId: z.string().uuid(),
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

export type AnnotateChunkInput = z.infer<typeof AnnotateChunkInputSchema>;

// Tool definition for MCP
export const annotateChunkToolDefinition = {
  name: 'annotate_chunk',
  description: 'Annotate a single chunk with categories, subtypes, and metadata',
  inputSchema: toJsonSchema(AnnotateChunkInputSchema, 'AnnotateChunkInput'),
};

// Tool handler
export function handleAnnotateChunk(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = AnnotateChunkInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for annotate_chunk');
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

  // Annotate the chunk
  const result = annotationService.annotateChunk({
    sessionId: input.sessionId,
    chunkId: input.chunkId,
    categories: input.categories,
    labels: input.labels,
    subtypes: input.subtypes as Record<string, string> | undefined,
    keywords: input.keywords,
    tags: input.tags,
    notes: input.notes,
    summary: input.summary,
  });

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'annotate_chunk took longer than 100ms');
  }

  if (!result.success) {
    logger.warn({ error: result.error }, 'Annotation failed');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.error),
        },
      ],
      isError: true,
    };
  }

  logger.info(
    { sessionId: input.sessionId, chunkId: input.chunkId },
    'Chunk annotated successfully'
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result.data),
      },
    ],
  };
}
