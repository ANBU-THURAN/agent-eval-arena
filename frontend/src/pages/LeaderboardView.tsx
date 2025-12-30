import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface LeaderboardEntry {
  agentId: string;
  agentName: string;
  provider: string;
  totalWealth: number;
  averageWealth: number;
  sessionsPlayed: number;
  wins: number;
  totalTrades: number;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface SessionLeaderboardEntry {
  agentId: string;
  agentName: string;
  provider: string;
  totalWealth: number;
  tradesCompleted: number;
}

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionLeaderboards, setSessionLeaderboards] = useState<Map<string, SessionLeaderboardEntry[]>>(new Map());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all-time leaderboard
      const leaderboardResponse = await fetch(`${API_BASE_URL}/leaderboard/alltime`);
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData);

      // Fetch all sessions
      const sessionsResponse = await fetch(`${API_BASE_URL}/sessions`);
      const sessionsData = await sessionsResponse.json();
      // Filter completed sessions and sort by startTime descending (newest first)
      const completedSessions = sessionsData
        .filter((s: Session) => s.status === 'completed')
        .sort((a: Session, b: Session) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

      // Fetch leaderboards for all sessions upfront
      const leaderboardPromises = completedSessions.map((session: Session) =>
        fetch(`${API_BASE_URL}/leaderboard/daily/${session.id}`)
          .then(res => res.json())
          .catch(() => []) // Return empty array on error
      );
      const leaderboards = await Promise.all(leaderboardPromises);

      // Filter out sessions with no leaderboard data
      const sessionsWithLeaderboards = completedSessions.filter(
        (_session: Session, index: number) => leaderboards[index].length > 0
      );

      setSessions(sessionsWithLeaderboards);

      // Build map only for sessions with data
      const newLeaderboards = new Map();
      sessionsWithLeaderboards.forEach((session: Session) => {
        const index = completedSessions.indexOf(session);
        newLeaderboards.set(session.id, leaderboards[index]);
      });
      setSessionLeaderboards(newLeaderboards);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchSessionLeaderboard = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/daily/${sessionId}`);
      const data = await response.json();
      setSessionLeaderboards(prev => new Map(prev).set(sessionId, data));
    } catch (error) {
      console.error('Error fetching session leaderboard:', error);
    }
  };

  const toggleSessionExpand = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Lazy load leaderboard if not already fetched
      if (!sessionLeaderboards.has(sessionId)) {
        fetchSessionLeaderboard(sessionId);
      }
    }
    setExpandedSessions(newExpanded);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
        Leaderboard
      </h2>

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div
          style={{
            marginBottom: 'var(--space-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-sm)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--space-sm)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)', marginBottom: '2px' }}>
              Total Sessions
            </p>
            <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {sessions.length}
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--space-sm)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)', marginBottom: '2px' }}>
              Total Trades
            </p>
            <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {leaderboard.reduce((sum, e) => sum + e.totalTrades, 0)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--space-sm)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)', marginBottom: '2px' }}>
              Active Agents
            </p>
            <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {leaderboard.length}
            </p>
          </div>
        </div>
      )}

      {/* All-Time Leaderboard */}
      <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
        All-Time Rankings
      </h3>

      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius)',
          overflow: 'hidden',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <th style={tableHeaderStyle}>Rank</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Agent</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Provider</th>
              <th style={tableHeaderStyle}>Avg Wealth</th>
              <th style={tableHeaderStyle}>Sessions</th>
              <th style={tableHeaderStyle}>Wins</th>
              <th style={tableHeaderStyle}>Trades</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No leaderboard data yet
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, index) => (
                <tr
                  key={entry.agentId}
                  style={{
                    borderBottom: index < leaderboard.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  }}
                >
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      fontWeight: 600,
                      color: index < 3 ? 'var(--color-primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {index + 1}
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{entry.agentName}</td>
                  <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>{entry.provider}</td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      color: 'var(--semantic-success)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ₹{entry.averageWealth.toFixed(2)}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {entry.sessionsPlayed}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {entry.wins}
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {entry.totalTrades}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Per-Session Leaderboards */}
      <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
        Session History
      </h3>

      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius)',
          overflow: 'hidden',
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>
              No completed sessions yet
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ ...tableHeaderStyle, width: '32px' }}></th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Date</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Time</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Winner</th>
                <th style={tableHeaderStyle}>Wealth</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, sessionIndex) => {
                const isExpanded = expandedSessions.has(session.id);
                const sessionLeaderboard = sessionLeaderboards.get(session.id);
                const winner = sessionLeaderboard?.[0];
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime);

                return (
                  <React.Fragment key={session.id}>
                    {/* Session Row */}
                    <tr
                      onClick={() => toggleSessionExpand(session.id)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'background-color var(--transition)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ ...tableCellStyle, textAlign: 'center', padding: 'var(--space-xs)' }}>
                        <span style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 500 }}>
                        {startDate.toLocaleDateString()}
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                        {winner ? winner.agentName : 'Loading...'}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--semantic-success)',
                          fontWeight: 600,
                        }}
                      >
                        {winner ? `₹${winner.totalWealth.toFixed(2)}` : '---'}
                      </td>
                    </tr>

                    {/* Expanded Leaderboard for this Session */}
                    {isExpanded && sessionLeaderboard && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                          <div
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              padding: 'var(--space-md)',
                              borderTop: '1px solid var(--border-primary)',
                              borderBottom: '1px solid var(--border-primary)',
                            }}
                          >
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                  <th style={{ ...expandedHeaderStyle }}>Rank</th>
                                  <th style={{ ...expandedHeaderStyle, textAlign: 'left' }}>Agent</th>
                                  <th style={{ ...expandedHeaderStyle, textAlign: 'left' }}>Provider</th>
                                  <th style={{ ...expandedHeaderStyle }}>Wealth</th>
                                  <th style={{ ...expandedHeaderStyle }}>Trades</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionLeaderboard.map((entry, rank) => {
                                  const failedRequirement = entry.tradesCompleted < 5;
                                  return (
                                    <tr
                                      key={entry.agentId}
                                      style={{
                                        borderBottom: rank < sessionLeaderboard.length - 1 ? '1px solid var(--border-primary)' : 'none',
                                        borderLeft: failedRequirement ? '2px solid var(--semantic-error)' : 'none',
                                      }}
                                    >
                                      <td
                                        style={{
                                          ...expandedCellStyle,
                                          textAlign: 'center',
                                          fontWeight: 600,
                                          color: rank < 3 ? 'var(--color-primary)' : 'var(--text-primary)',
                                          fontFamily: 'var(--font-mono)',
                                        }}
                                      >
                                        {rank + 1}
                                      </td>
                                      <td
                                        style={{
                                          ...expandedCellStyle,
                                          fontWeight: 600,
                                          color: failedRequirement ? 'var(--semantic-error)' : 'var(--text-primary)',
                                        }}
                                      >
                                        {entry.agentName}
                                      </td>
                                      <td style={{ ...expandedCellStyle, color: 'var(--text-secondary)' }}>
                                        {entry.provider}
                                      </td>
                                      <td
                                        style={{
                                          ...expandedCellStyle,
                                          textAlign: 'center',
                                          color: 'var(--semantic-success)',
                                          fontWeight: 600,
                                          fontFamily: 'var(--font-mono)',
                                        }}
                                      >
                                        ₹{entry.totalWealth.toFixed(2)}
                                      </td>
                                      <td
                                        style={{
                                          ...expandedCellStyle,
                                          textAlign: 'center',
                                          fontFamily: 'var(--font-mono)',
                                          color: failedRequirement ? 'var(--semantic-error)' : 'var(--text-primary)',
                                          fontWeight: failedRequirement ? 600 : 400,
                                        }}
                                      >
                                        {entry.tradesCompleted}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: 'var(--space-xs) var(--space-sm)',
  textAlign: 'center',
  fontSize: 'var(--font-size-secondary)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const tableCellStyle: React.CSSProperties = {
  padding: 'var(--space-xs) var(--space-sm)',
  fontSize: 'var(--font-size-secondary)',
};

const expandedHeaderStyle: React.CSSProperties = {
  padding: 'var(--space-xs)',
  textAlign: 'center',
  fontSize: 'var(--font-size-secondary)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const expandedCellStyle: React.CSSProperties = {
  padding: 'var(--space-xs)',
  fontSize: 'var(--font-size-secondary)',
};
