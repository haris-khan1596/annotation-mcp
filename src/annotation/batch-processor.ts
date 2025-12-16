import type { ChunkAnnotation, BatchAnnotationResult, AnnotationItemResult } from '../types/annotation.types.js';
import type { AnnotationError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success } from '../types/result.types.js';
import { annotationService, type AnnotateChunkInput } from './annotation-service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('batch-processor');

export interface BatchAnnotateInput {
  sessionId: string;
  annotations: Array<Omit<AnnotateChunkInput, 'sessionId'>>;
}

/**
 * Batch processor for annotating multiple chunks with partial success semantics
 */
class BatchProcessor {
  /**
   * Annotate multiple chunks in a single call
   * Uses partial success semantics: continues processing even if some chunks fail
   */
  annotateChunks(input: BatchAnnotateInput): Result<BatchAnnotationResult, never> {
    const results: AnnotationItemResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = Date.now();

    for (const annotation of input.annotations) {
      const result = annotationService.annotateChunk({
        sessionId: input.sessionId,
        ...annotation,
      });

      if (result.success) {
        results.push({
          chunkId: annotation.chunkId,
          success: true,
          data: result.data,
        });
        successCount++;
      } else {
        results.push({
          chunkId: annotation.chunkId,
          success: false,
          error: {
            type: result.error.type,
            message: result.error.message,
          },
        });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    if (duration > 100) {
      logger.info(
        { duration, total: input.annotations.length, successCount, errorCount },
        'Batch annotation took longer than 100ms'
      );
    }

    logger.info(
      { sessionId: input.sessionId, total: input.annotations.length, successCount, errorCount },
      'Batch annotation completed'
    );

    return success({
      results,
      successCount,
      errorCount,
    });
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor();
