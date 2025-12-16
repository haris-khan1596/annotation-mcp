import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';

/**
 * Convert a Zod schema to JSON Schema for MCP tool definitions.
 * Handles Zod v4 compatibility with zod-to-json-schema.
 */
export function toJsonSchema<T extends z.ZodType>(schema: T, name?: string): object {
  // zod-to-json-schema works with Zod v4 at runtime despite type mismatches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodToJsonSchema(schema as any, name);
}
