import { z } from 'zod';
import { sessionManager } from '../../session/session-manager.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('get-progress');

// Input schema for get_progress tool
export const GetProgressInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export type GetProgressInput = z.infer<typeof GetProgressInputSchema>;

// Tool definition for MCP
export const getProgressToolDefinition = {
  name: 'get_progress',
  description: 'Query annotation progress for a session',
  inputSchema: toJsonSchema(GetProgressInputSchema, 'GetProgressInput'),
};

// Tool handler
export function handleGetProgress(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = GetProgressInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for get_progress');
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

  // Get progress
  const result = sessionManager.getProgress(sessionId);

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'get_progress took longer than 100ms');
  }

  if (!result.success) {
    logger.warn({ error: result.error }, 'Get progress failed');
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
    {
      sessionId,
      totalChunks: result.data.totalChunks,
      annotatedChunks: result.data.annotatedChunks,
      completionPercentage: result.data.completionPercentage,
    },
    'Progress retrieved successfully'
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
