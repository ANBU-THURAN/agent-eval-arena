import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { NotFoundError } from '../errors/index.js';

export interface SessionInfo {
  id: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'active' | 'completed';
}

export interface CurrentSessionResponse {
  type: 'active' | 'scheduled' | 'none';
  session: SessionInfo | null;
}

/**
 * SessionService handles all session-related business logic
 * Provides CRUD operations and session state management
 */
export class SessionService {
  /**
   * Get all sessions ordered by start time (newest first)
   */
  async getAllSessions(): Promise<SessionInfo[]> {
    const sessions = await db.query.sessions.findMany({
      orderBy: [desc(schema.sessions.startTime)],
    });
    return sessions;
  }

  /**
   * Get session by ID
   * @throws NotFoundError if session doesn't exist
   */
  async getSessionById(sessionId: string): Promise<SessionInfo> {
    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.id, sessionId),
    });

    if (!session) {
      throw new NotFoundError(`Session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Get current or next session
   * Returns the active session, or the next scheduled session, or none
   */
  async getCurrentSession(): Promise<CurrentSessionResponse> {
    // Check for active session
    const activeSession = await db.query.sessions.findFirst({
      where: eq(schema.sessions.status, 'active'),
    });

    if (activeSession) {
      return {
        type: 'active',
        session: activeSession,
      };
    }

    // Get next scheduled session
    const scheduledSession = await db.query.sessions.findFirst({
      where: eq(schema.sessions.status, 'scheduled'),
      orderBy: [desc(schema.sessions.startTime)],
    });

    if (scheduledSession) {
      return {
        type: 'scheduled',
        session: scheduledSession,
      };
    }

    // No session found
    return {
      type: 'none',
      session: null,
    };
  }

  /**
   * Check if there's an active session
   */
  async hasActiveSession(): Promise<boolean> {
    const activeSession = await db.query.sessions.findFirst({
      where: eq(schema.sessions.status, 'active'),
    });
    return activeSession !== undefined;
  }

  /**
   * Get the active session
   * @throws NotFoundError if no active session exists
   */
  async getActiveSession(): Promise<SessionInfo> {
    const activeSession = await db.query.sessions.findFirst({
      where: eq(schema.sessions.status, 'active'),
    });

    if (!activeSession) {
      throw new NotFoundError('No active session found');
    }

    return activeSession;
  }
}
