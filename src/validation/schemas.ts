// Consolidated Zod Schema Exports
// Re-export all schemas from a single location for convenience

export {
  CategorySchema,
  LabelSchema,
  FeeScheduleSubtypeSchema,
  FootnotesSubtypeSchema,
  SubtypeSchema,
  RelationTypeSchema,
  ChunkAnnotationSchema,
  AnnotationExportSchema,
  AnnotationItemResultSchema,
  BatchAnnotationResultSchema,
} from '../types/annotation.types.js';

export type {
  Category,
  Label,
  FeeScheduleSubtype,
  FootnotesSubtype,
  Subtype,
  RelationType,
  ChunkAnnotation,
  AnnotationExport,
  AnnotationItemResult,
  BatchAnnotationResult,
} from '../types/annotation.types.js';

export { ConfigChunkSchema, ConfigFileSchema } from '../types/config.types.js';

export type { ConfigChunk, ConfigFile } from '../types/config.types.js';

export {
  SessionSchema,
  SessionStateSchema,
  SessionCreatedResponseSchema,
  ProgressResponseSchema,
} from '../types/session.types.js';

export type {
  Session,
  SessionState,
  SessionCreatedResponse,
  ProgressResponse,
} from '../types/session.types.js';

export {
  SessionErrorSchema,
  AnnotationErrorSchema,
  RelationErrorSchema,
} from '../types/error.types.js';

export type {
  SessionError,
  AnnotationError,
  RelationError,
  SessionResult,
  AnnotationResult,
  RelationResult,
} from '../types/error.types.js';

export type { Result, Success, Failure } from '../types/result.types.js';

export { success, failure } from '../types/result.types.js';
