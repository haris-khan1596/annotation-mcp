import type { RelationType, RelationsRecord } from '../types/annotation.types.js';
import type { RelationError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success, failure } from '../types/result.types.js';
import { sessionManager } from '../session/session-manager.js';
import { validateRelationType } from '../validation/literal-validators.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('relation-manager');

export interface AddRelationInput {
  sessionId: string;
  sourceChunkId: string;
  targetChunkId: string;
  relationType: string;
}

export interface AddRelationResponse {
  message: string;
  sourceChunkId: string;
  targetChunkId: string;
  relationType: RelationType;
}

/**
 * Manager for handling relations between chunks
 */
class RelationManager {
  /**
   * Add a directed relation from source chunk to target chunk
   * @param input The relation details
   * @returns Result with success message or error
   */
  addRelation(input: AddRelationInput): Result<AddRelationResponse, RelationError> {
    // Get session
    const sessionResult = sessionManager.get(input.sessionId);
    if (!sessionResult.success) {
      return failure({
        type: 'TargetNotFound',
        targetChunkId: input.sourceChunkId,
        message: `Session not found: ${input.sessionId}`,
      });
    }

    const session = sessionResult.data;

    // Validate relation type
    const relationTypeResult = validateRelationType(input.relationType);
    if (!relationTypeResult.success) {
      return relationTypeResult;
    }
    const relationType = relationTypeResult.data;

    // Verify source chunk exists in config
    if (!sessionManager.hasChunk(session, input.sourceChunkId)) {
      return failure({
        type: 'TargetNotFound',
        targetChunkId: input.sourceChunkId,
        message: `Source chunk not found in session: ${input.sourceChunkId}`,
      });
    }

    // Verify target chunk exists in config
    if (!sessionManager.hasChunk(session, input.targetChunkId)) {
      return failure({
        type: 'TargetNotFound',
        targetChunkId: input.targetChunkId,
        message: `Target chunk not found in session: ${input.targetChunkId}`,
      });
    }

    // Get or create annotation for source chunk
    let sourceAnnotation = session.annotations.get(input.sourceChunkId);
    if (!sourceAnnotation) {
      // Create a minimal annotation for the source chunk
      const configChunk = sessionManager.getChunk(session, input.sourceChunkId);
      if (!configChunk) {
        return failure({
          type: 'TargetNotFound',
          targetChunkId: input.sourceChunkId,
          message: `Source chunk not found: ${input.sourceChunkId}`,
        });
      }

      sourceAnnotation = {
        chunk_id: input.sourceChunkId,
        position: configChunk.position,
        categories: [],
        labels: [],
        subtypes: {},
        keywords: [],
        tags: [],
        relations: {},
        notes: '',
        summary: '',
      };
    }

    // Add the relation
    const relations: RelationsRecord = { ...sourceAnnotation.relations };
    const existingTargets = relations[relationType] ?? [];

    // Avoid duplicate relations
    if (!existingTargets.includes(input.targetChunkId)) {
      relations[relationType] = [...existingTargets, input.targetChunkId];
    }

    // Update the annotation with new relations
    const updatedAnnotation = {
      ...sourceAnnotation,
      relations,
    };

    sessionManager.saveAnnotation(session, updatedAnnotation);

    logger.info(
      {
        sessionId: input.sessionId,
        sourceChunkId: input.sourceChunkId,
        targetChunkId: input.targetChunkId,
        relationType,
      },
      'Relation added'
    );

    return success({
      message: 'Relation added',
      sourceChunkId: input.sourceChunkId,
      targetChunkId: input.targetChunkId,
      relationType,
    });
  }
}

// Export singleton instance
export const relationManager = new RelationManager();
