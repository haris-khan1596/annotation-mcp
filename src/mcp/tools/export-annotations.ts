import { z } from 'zod';
import { annotationService } from '../../annotation/annotation-service.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('export-annotations');

// Input schema for export_annotations tool
export const ExportAnnotationsInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export type ExportAnnotationsInput = z.infer<typeof ExportAnnotationsInputSchema>;

// Tool definition for MCP
export const exportAnnotationsToolDefinition = {
  name: 'export_annotations',
  description: 'Export complete annotation JSON for the session',
  inputSchema: toJsonSchema(ExportAnnotationsInputSchema, 'ExportAnnotationsInput'),
};

// Tool handler
export function handleExportAnnotations(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = ExportAnnotationsInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for export_annotations');
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

  const { sessionId } = parseResult.data;

  // Export annotations
  const result = annotationService.exportAnnotations(sessionId);

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'export_annotations took longer than 100ms');
  }

  if (!result.success) {
    logger.warn({ error: result.error }, 'Export failed');
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
    { sessionId, chunkCount: result.data.chunks.length },
    'Annotations exported successfully'
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
