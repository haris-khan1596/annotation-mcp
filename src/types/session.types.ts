import { z } from 'zod';
import { ConfigFileSchema } from './config.types.js';
import { ChunkAnnotationSchema } from './annotation.types.js';

// Session State

export const SessionStateSchema = z.enum(['active', 'expired']);
export type SessionState = z.infer<typeof SessionStateSchema>;

// Session Schema
// Note: For runtime use, annotations is a Map<string, ChunkAnnotation>
// The Zod schema is primarily for type inference

export const SessionSchema = z.object({
  id: z.string().uuid(),
  config: ConfigFileSchema,
  annotations: z.map(z.string(), ChunkAnnotationSchema),
  state: SessionStateSchema.default('active'),
  createdAt: z.date(),
  lastAccessedAt: z.date(),
});
export type Session = z.infer<typeof SessionSchema>;

// Session creation response

export const SessionCreatedResponseSchema = z.object({
  sessionId: z.string().uuid(),
  chunkCount: z.number().int().nonnegative(),
  message: z.string(),
});
export type SessionCreatedResponse = z.infer<typeof SessionCreatedResponseSchema>;

// Progress response

export const ProgressResponseSchema = z.object({
  totalChunks: z.number().int().nonnegative(),
  annotatedChunks: z.number().int().nonnegative(),
  pendingChunks: z.number().int().nonnegative(),
  completionPercentage: z.number().min(0).max(100),
  pendingChunkIds: z.array(z.string()),
});
export type ProgressResponse = z.infer<typeof ProgressResponseSchema>;
