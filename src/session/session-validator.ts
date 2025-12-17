import type { Session } from '../types/session.types.js';
import type { SessionError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success, failure } from '../types/result.types.js';
import { sessionManager } from './session-manager.js';

/**
 * Validates that a session exists and is accessible
 * @param sessionId The session ID to validate
 * @returns Result with session or error
 */
export function validateSession(sessionId: string): Result<Session, SessionError> {
  return sessionManager.get(sessionId);
}

/**
 * Validates that a chunk ID exists in a session
 * @param session The session
 * @param chunkId The chunk ID to validate
 * @returns Result with true or error
 */
export function validateChunkExists(
  session: Session,
  chunkId: string
): Result<true, SessionError> {
  if (!sessionManager.hasChunk(session, chunkId)) {
    return failure({
      type: 'SessionNotFound', // Using SessionNotFound for simplicity since ChunkNotFound is in AnnotationError
      sessionId: session.id,
      message: `Chunk not found in session: ${chunkId}`,
    });
  }
  return success(true);
}

/**
 * Validates session ID format (UUID v4)
 * @param sessionId The session ID to validate
 */
export function isValidUUID(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}
