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
export declare class SessionService {
    /**
     * Get all sessions ordered by start time (newest first)
     */
    getAllSessions(): Promise<SessionInfo[]>;
    /**
     * Get session by ID
     * @throws NotFoundError if session doesn't exist
     */
    getSessionById(sessionId: string): Promise<SessionInfo>;
    /**
     * Get current or next session
     * Returns the active session, or the next scheduled session, or none
     */
    getCurrentSession(): Promise<CurrentSessionResponse>;
    /**
     * Check if there's an active session
     */
    hasActiveSession(): Promise<boolean>;
    /**
     * Get the active session
     * @throws NotFoundError if no active session exists
     */
    getActiveSession(): Promise<SessionInfo>;
}
//# sourceMappingURL=SessionService.d.ts.map