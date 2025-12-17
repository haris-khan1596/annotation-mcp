import { z } from 'zod';

// Session Errors

export const SessionNotFoundErrorSchema = z.object({
  type: z.literal('SessionNotFound'),
  sessionId: z.string(),
  message: z.string().default('Session not found'),
});

export const InvalidConfigErrorSchema = z.object({
  type: z.literal('InvalidConfig'),
  issues: z.array(z.any()), // ZodIssue[]
  message: z.string(),
});

export const DuplicateChunkIdErrorSchema = z.object({
  type: z.literal('DuplicateChunkId'),
  chunkId: z.string(),
  message: z.string(),
});

export const SessionErrorSchema = z.discriminatedUnion('type', [
  SessionNotFoundErrorSchema,
  InvalidConfigErrorSchema,
  DuplicateChunkIdErrorSchema,
]);
export type SessionError = z.infer<typeof SessionErrorSchema>;

// Annotation Errors

export const InvalidCategoryErrorSchema = z.object({
  type: z.literal('InvalidCategory'),
  category: z.string(),
  validOptions: z.array(z.string()),
  message: z.string(),
});

export const InvalidSubtypeErrorSchema = z.object({
  type: z.literal('InvalidSubtype'),
  subtype: z.string(),
  category: z.string(),
  validOptions: z.array(z.string()),
  message: z.string(),
});

export const ChunkNotFoundErrorSchema = z.object({
  type: z.literal('ChunkNotFound'),
  chunkId: z.string(),
  message: z.string(),
});

export const SubtypeCategoryMismatchErrorSchema = z.object({
  type: z.literal('SubtypeCategoryMismatch'),
  subtype: z.string(),
  category: z.string(),
  message: z.string(),
});

export const AnnotationErrorSchema = z.discriminatedUnion('type', [
  InvalidCategoryErrorSchema,
  InvalidSubtypeErrorSchema,
  ChunkNotFoundErrorSchema,
  SubtypeCategoryMismatchErrorSchema,
]);
export type AnnotationError = z.infer<typeof AnnotationErrorSchema>;

// Relation Errors

export const InvalidRelationTypeErrorSchema = z.object({
  type: z.literal('InvalidRelationType'),
  relationType: z.string(),
  validOptions: z.array(z.string()),
  message: z.string(),
});

export const TargetNotFoundErrorSchema = z.object({
  type: z.literal('TargetNotFound'),
  targetChunkId: z.string(),
  message: z.string(),
});

export const RelationErrorSchema = z.discriminatedUnion('type', [
  InvalidRelationTypeErrorSchema,
  TargetNotFoundErrorSchema,
]);
export type RelationError = z.infer<typeof RelationErrorSchema>;

// Common result types
import type { Result } from './result.types.js';

export type SessionResult<T> = Result<T, SessionError>;
export type AnnotationResult<T> = Result<T, AnnotationError>;
export type RelationResult<T> = Result<T, RelationError>;
