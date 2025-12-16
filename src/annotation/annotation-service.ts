import type { Session } from '../types/session.types.js';
import type { ChunkAnnotation, Category, Label, Subtype } from '../types/annotation.types.js';
import type { AnnotationError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success, failure } from '../types/result.types.js';
import { sessionManager } from '../session/session-manager.js';
import {
  validateCategory,
  validateSubtypeForCategory,
} from '../validation/literal-validators.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('annotation-service');

export interface AnnotateChunkInput {
  sessionId: string;
  chunkId: string;
  categories?: string[];
  labels?: string[];
  subtypes?: Record<string, string>;
  keywords?: string[];
  tags?: string[];
  notes?: string;
  summary?: string;
}

/**
 * Service for annotating chunks with categories, subtypes, and metadata
 */
class AnnotationService {
  /**
   * Annotate a single chunk with categories, subtypes, and metadata
   * If an annotation already exists for this chunk, it will be updated (not inserted)
   */
  annotateChunk(input: AnnotateChunkInput): Result<ChunkAnnotation, AnnotationError> {
    // Get session
    const sessionResult = sessionManager.get(input.sessionId);
    if (!sessionResult.success) {
      return failure({
        type: 'ChunkNotFound',
        chunkId: input.chunkId,
        message: `Session not found: ${input.sessionId}`,
      });
    }

    const session = sessionResult.data;

    // Verify chunk exists in config
    const configChunk = sessionManager.getChunk(session, input.chunkId);
    if (!configChunk) {
      return failure({
        type: 'ChunkNotFound',
        chunkId: input.chunkId,
        message: `Chunk not found in session: ${input.chunkId}`,
      });
    }

    // Validate categories
    const validatedCategories: Category[] = [];
    if (input.categories) {
      for (const cat of input.categories) {
        const catResult = validateCategory(cat);
        if (!catResult.success) {
          return catResult;
        }
        validatedCategories.push(catResult.data);
      }
    }

    // Validate labels (map to expected format)
    const validatedLabels: Label[] = [];
    if (input.labels) {
      for (const label of input.labels) {
        if (label !== 'Fee Schedule' && label !== 'Footnotes') {
          return failure({
            type: 'InvalidCategory',
            category: label,
            validOptions: ['Fee Schedule', 'Footnotes'],
            message: `Invalid label '${label}'. Valid options: Fee Schedule, Footnotes`,
          });
        }
        validatedLabels.push(label);
      }
    }

    // Validate subtypes and ensure they match their categories
    const validatedSubtypes: Partial<Record<Category, Subtype>> = {};
    if (input.subtypes) {
      for (const [category, subtype] of Object.entries(input.subtypes)) {
        // First validate the category
        const catResult = validateCategory(category);
        if (!catResult.success) {
          return catResult;
        }

        // Check that the category is in the categories list
        if (!validatedCategories.includes(catResult.data)) {
          return failure({
            type: 'SubtypeCategoryMismatch',
            subtype,
            category,
            message: `Category '${category}' in subtypes but not in categories array`,
          });
        }

        // Then validate the subtype for that category
        const subtypeResult = validateSubtypeForCategory(catResult.data, subtype);
        if (!subtypeResult.success) {
          return subtypeResult;
        }

        validatedSubtypes[catResult.data] = subtypeResult.data;
      }
    }

    // Get existing annotation or create new one
    const existingAnnotation = session.annotations.get(input.chunkId);

    // Build the annotation chunk_id in the expected format
    const primaryCategory = validatedCategories[0] ?? existingAnnotation?.categories[0];
    const primaryLabel = validatedLabels[0] ?? existingAnnotation?.labels[0];
    const chunkIdFormatted = primaryCategory && primaryLabel
      ? `${configChunk.position}_${primaryCategory}_${primaryLabel}`
      : input.chunkId;

    const annotation: ChunkAnnotation = {
      chunk_id: chunkIdFormatted,
      position: configChunk.position,
      categories: validatedCategories.length > 0 ? validatedCategories : existingAnnotation?.categories ?? [],
      labels: validatedLabels.length > 0 ? validatedLabels : existingAnnotation?.labels ?? [],
      subtypes: Object.keys(validatedSubtypes).length > 0
        ? validatedSubtypes
        : existingAnnotation?.subtypes ?? {},
      keywords: input.keywords ?? existingAnnotation?.keywords ?? [],
      tags: input.tags ?? existingAnnotation?.tags ?? [],
      relations: existingAnnotation?.relations ?? {},
      notes: input.notes ?? existingAnnotation?.notes ?? '',
      summary: input.summary ?? existingAnnotation?.summary ?? '',
    };

    // Save the annotation (updates if exists)
    sessionManager.saveAnnotation(session, annotation);

    logger.debug(
      { sessionId: input.sessionId, chunkId: input.chunkId },
      'Chunk annotated'
    );

    return success(annotation);
  }

  /**
   * Get an annotation for a chunk
   */
  getAnnotation(session: Session, chunkId: string): ChunkAnnotation | undefined {
    return session.annotations.get(chunkId);
  }

  /**
   * Export all annotations from a session
   */
  exportAnnotations(sessionId: string): Result<{ chunks: ChunkAnnotation[] }, AnnotationError> {
    const sessionResult = sessionManager.get(sessionId);
    if (!sessionResult.success) {
      return failure({
        type: 'ChunkNotFound',
        chunkId: '',
        message: `Session not found: ${sessionId}`,
      });
    }

    const session = sessionResult.data;
    const chunks: ChunkAnnotation[] = [];

    // Export all chunks - annotated ones have full data, un-annotated ones are marked as pending
    for (const configChunk of session.config.chunks) {
      const annotation = session.annotations.get(configChunk.chunk_id);
      if (annotation) {
        chunks.push(annotation);
      } else {
        // Create a "pending" annotation for un-annotated chunks
        chunks.push({
          chunk_id: configChunk.chunk_id,
          position: configChunk.position,
          categories: [],
          labels: [],
          subtypes: {},
          keywords: [],
          tags: [],
          relations: {},
          notes: '',
          summary: '',
        });
      }
    }

    logger.info(
      { sessionId, totalChunks: chunks.length, annotated: session.annotations.size },
      'Annotations exported'
    );

    return success({ chunks });
  }
}

// Export singleton instance
export const annotationService = new AnnotationService();
