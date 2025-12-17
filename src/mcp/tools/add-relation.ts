import { z } from 'zod';
import { RelationTypeSchema } from '../../types/annotation.types.js';
import { relationManager } from '../../annotation/relation-manager.js';
import { createLogger } from '../../utils/logger.js';
import { toJsonSchema } from '../../utils/schema-helpers.js';

const logger = createLogger('add-relation');

// Input schema for add_relation tool
export const AddRelationInputSchema = z.object({
  sessionId: z.string().uuid(),
  sourceChunkId: z.string().min(1),
  targetChunkId: z.string().min(1),
  relationType: RelationTypeSchema,
});

export type AddRelationInput = z.infer<typeof AddRelationInputSchema>;

// Tool definition for MCP
export const addRelationToolDefinition = {
  name: 'add_relation',
  description: 'Define a directed relation between two chunks',
  inputSchema: toJsonSchema(AddRelationInputSchema, 'AddRelationInput'),
};

// Tool handler
export function handleAddRelation(args: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
} {
  const startTime = Date.now();

  // Validate input
  const parseResult = AddRelationInputSchema.safeParse(args);
  if (!parseResult.success) {
    logger.warn({ issues: parseResult.error.issues }, 'Invalid input for add_relation');
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

  // Add the relation
  const result = relationManager.addRelation({
    sessionId: input.sessionId,
    sourceChunkId: input.sourceChunkId,
    targetChunkId: input.targetChunkId,
    relationType: input.relationType,
  });

  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.info({ duration }, 'add_relation took longer than 100ms');
  }

  if (!result.success) {
    logger.warn({ error: result.error }, 'Add relation failed');
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
      sessionId: input.sessionId,
      sourceChunkId: input.sourceChunkId,
      targetChunkId: input.targetChunkId,
      relationType: input.relationType,
    },
    'Relation added successfully'
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
