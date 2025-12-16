import { randomUUID } from 'node:crypto';
import { ConfigFileSchema } from '../types/config.types.js';
import type { Session, SessionCreatedResponse, ProgressResponse } from '../types/session.types.js';
import type { ChunkAnnotation } from '../types/annotation.types.js';
import type { SessionError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success, failure } from '../types/result.types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('session-manager');

/**
 * In-memory session manager using Map storage
 * Sessions are lost on server restart (by design for MVP)
 */
class SessionManager {
  private sessions = new Map<string, Session>();

  /**
   * Create a new annotation session with a config file
   * @param config The config file containing chunks to annotate
   * @returns Result with session details or error
   */
  create(config: unknown): Result<SessionCreatedResponse, SessionError> {
    // Validate config against schema
    const parseResult = ConfigFileSchema.safeParse(config);
    if (!parseResult.success) {
      logger.warn({ issues: parseResult.error.issues }, 'Invalid config file');
      return failure({
        type: 'InvalidConfig',
        issues: parseResult.error.issues,
        message: `Config validation failed: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      });
    }

    const validConfig = parseResult.data;

    // Check for duplicate chunk IDs
    const chunkIds = new Set<string>();
    for (const chunk of validConfig.chunks) {
      if (chunkIds.has(chunk.chunk_id)) {
        logger.warn({ chunkId: chunk.chunk_id }, 'Duplicate chunk_id found');
        return failure({
          type: 'DuplicateChunkId',
          chunkId: chunk.chunk_id,
          message: `Duplicate chunk_id found: ${chunk.chunk_id}`,
        });
      }
      chunkIds.add(chunk.chunk_id);
    }

    const sessionId = randomUUID();
    const now = new Date();

    const session: Session = {
      id: sessionId,
      config: validConfig,
      annotations: new Map<string, ChunkAnnotation>(),
      state: 'active',
      createdAt: now,
      lastAccessedAt: now,
    };

    this.sessions.set(sessionId, session);
    logger.info({ sessionId, chunkCount: validConfig.chunks.length }, 'Session created');

    return success({
      sessionId,
      chunkCount: validConfig.chunks.length,
      message: 'Session created successfully',
    });
  }

  /**
   * Get a session by ID
   * @param sessionId The session ID
   * @returns Result with session or error
   */
  get(sessionId: string): Result<Session, SessionError> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.debug({ sessionId }, 'Session not found');
      return failure({
        type: 'SessionNotFound',
        sessionId,
        message: `Session not found: ${sessionId}`,
      });
    }

    // Update last accessed time
    session.lastAccessedAt = new Date();
    return success(session);
  }

  /**
   * Check if a chunk ID exists in the session's config
   * @param session The session to check
   * @param chunkId The chunk ID to look for
   */
  hasChunk(session: Session, chunkId: string): boolean {
    return session.config.chunks.some((c) => c.chunk_id === chunkId);
  }

  /**
   * Get chunk by ID from session config
   * @param session The session
   * @param chunkId The chunk ID
   */
  getChunk(session: Session, chunkId: string) {
    return session.config.chunks.find((c) => c.chunk_id === chunkId);
  }

  /**
   * Save an annotation to a session
   * @param session The session
   * @param annotation The annotation to save
   */
  saveAnnotation(session: Session, annotation: ChunkAnnotation): void {
    session.annotations.set(annotation.chunk_id, annotation);
    session.lastAccessedAt = new Date();
    logger.debug({ sessionId: session.id, chunkId: annotation.chunk_id }, 'Annotation saved');
  }

  /**
   * Get annotation progress for a session
   * @param sessionId The session ID
   * @returns Result with progress or error
   */
  getProgress(sessionId: string): Result<ProgressResponse, SessionError> {
    const sessionResult = this.get(sessionId);
    if (!sessionResult.success) {
      return sessionResult;
    }

    const session = sessionResult.data;
    const totalChunks = session.config.chunks.length;
    const annotatedChunks = session.annotations.size;
    const pendingChunks = totalChunks - annotatedChunks;
    const completionPercentage =
      totalChunks > 0 ? Math.round((annotatedChunks / totalChunks) * 10000) / 100 : 100;

    // Get IDs of chunks that haven't been annotated
    const annotatedIds = new Set(session.annotations.keys());
    const pendingChunkIds = session.config.chunks
      .filter((c) => !annotatedIds.has(c.chunk_id))
      .map((c) => c.chunk_id);

    return success({
      totalChunks,
      annotatedChunks,
      pendingChunks,
      completionPercentage,
      pendingChunkIds,
    });
  }

  /**
   * Delete a session (for testing or cleanup)
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get session count (for monitoring)
   */
  get sessionCount(): number {
    return this.sessions.size;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
