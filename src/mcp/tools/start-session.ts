import { z } from 'zod';
import { ConfigFileSchema } from '../../types/config.types.js';
import { sessionManager } from '../../session/session-manager.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('start-session');

// Input schema for start_session tool
export const StartSessionInputSchema = z.object({
  config: ConfigFileSchema,
});

export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;

// Tool definition for MCP
export const startSessionToolDefinition = {
  name: 'start_session',
  description: 'Initialize a new annotation session with a config file containing document chunks',
  inputSchema: toJsonSchema(StartSessionInputSchema, 'StartSessionInput'),
};

// Tool handler
export function handleStartSession(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = StartSessionInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for start_session');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'InvalidConfig',
            message: 'Invalid input parameters',
            issues: parseResult.error.issues,
          }),
        },
      ],
      isError: true,
    };
  }

  const { config } = parseResult.data;

  // Create session
  const result = sessionManager.create(config);

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'start_session took longer than 100ms');
  }

  if (!result.success) {
    logger.warn({ error: result.error }, 'Session creation failed');
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
    { sessionId: result.data.sessionId, chunkCount: result.data.chunkCount },
    'Session created successfully'
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
