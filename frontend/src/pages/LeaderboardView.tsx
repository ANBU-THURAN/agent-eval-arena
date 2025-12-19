import React, { useEffect, useState } from 'react';

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
      const leaderboardResponse = await fetch('/api/leaderboard/alltime');
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData);

      // Fetch all sessions
      const sessionsResponse = await fetch('/api/sessions');
      const sessionsData = await sessionsResponse.json();
      // Filter completed sessions and sort by startTime descending (newest first)
      const completedSessions = sessionsData
        .filter((s: Session) => s.status === 'completed')
        .sort((a: Session, b: Session) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );

      // Fetch leaderboards for all sessions upfront
      const leaderboardPromises = completedSessions.map((session: Session) =>
        fetch(`/api/leaderboard/daily/${session.id}`)
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
      const response = await fetch(`/api/leaderboard/daily/${sessionId}`);
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
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-bold)',
          marginBottom: 'var(--space-4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Leaderboard
      </h2>

      {/* Stats Summary - at the top */}
      {leaderboard.length > 0 && (
        <div
          style={{
            marginBottom: 'var(--space-3)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-01)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
            }}
          >
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Sessions
            </p>
            <p
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
              }}
            >
              {sessions.length}
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'var(--surface-01)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
            }}
          >
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Total Trades
            </p>
            <p
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
              }}
            >
              {leaderboard.reduce((sum, e) => sum + e.totalTrades, 0)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: 'var(--surface-01)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-2)',
            }}
          >
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Active Agents
            </p>
            <p
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
              }}
            >
              {leaderboard.length}
            </p>
          </div>
        </div>
      )}

      {/* All-Time Leaderboard */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          marginBottom: 'var(--space-4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        All-Time Rankings
      </h3>

      <div
        style={{
          backgroundColor: 'var(--surface-01)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-02)' }}>
              <th style={tableHeaderStyle}>Rank</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Agent</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Provider</th>
              <th style={tableHeaderStyle}>Avg Wealth</th>
              <th style={tableHeaderStyle}>Sessions</th>
              <th style={tableHeaderStyle}>Wins</th>
              <th style={tableHeaderStyle}>Total Trades</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center' }}>
                  No leaderboard data yet
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, index) => (
                <tr
                  key={entry.agentId}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'var(--surface-01)' : 'var(--surface-02)',
                  }}
                >
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{entry.agentName}</td>
                  <td style={tableCellStyle}>{entry.provider}</td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      color: 'var(--success)',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ₹{entry.averageWealth.toFixed(2)}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {entry.sessionsPlayed}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {entry.wins}
                  </td>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {entry.totalTrades}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Per-Session Leaderboards */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          marginBottom: 'var(--space-4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Session History
      </h3>

      <div
        style={{
          backgroundColor: 'var(--surface-01)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No completed sessions yet</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-02)' }}>
                <th style={{ ...tableHeaderStyle, width: '50px' }}></th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Date</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Time</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Winner</th>
                <th style={tableHeaderStyle}>Winner Wealth</th>
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
                        backgroundColor:
                          sessionIndex % 2 === 0 ? 'var(--surface-01)' : 'var(--surface-02)',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-base)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface-03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          sessionIndex % 2 === 0 ? 'var(--surface-01)' : 'var(--surface-02)';
                      }}
                    >
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            color: 'var(--accent-cyan)',
                            fontSize: 'var(--text-lg)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform var(--transition-base)',
                          }}
                        >
                          ▼
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 'var(--weight-semibold)' }}>
                        {startDate.toLocaleDateString()}
                      </td>
                      <td style={{ ...tableCellStyle, fontFamily: 'var(--font-mono)' }}>
                        {startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
                      </td>
                      <td style={{ ...tableCellStyle, fontWeight: 'var(--weight-bold)' }}>
                        {winner ? winner.agentName : 'Loading...'}
                      </td>
                      <td
                        style={{
                          ...tableCellStyle,
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--success)',
                          fontWeight: 'var(--weight-bold)',
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
                              padding: 'var(--space-4)',
                              borderTop: '1px solid var(--border-primary)',
                              borderBottom: '1px solid var(--border-primary)',
                              animation: 'fadeIn 0.3s ease-out',
                            }}
                          >
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ backgroundColor: 'var(--surface-02)' }}>
                                  <th
                                    style={{
                                      ...tableHeaderStyle,
                                      fontSize: 'var(--text-xs)',
                                      padding: 'var(--space-2) var(--space-3)',
                                    }}
                                  >
                                    Rank
                                  </th>
                                  <th
                                    style={{
                                      ...tableHeaderStyle,
                                      textAlign: 'left',
                                      fontSize: 'var(--text-xs)',
                                      padding: 'var(--space-2) var(--space-3)',
                                    }}
                                  >
                                    Agent
                                  </th>
                                  <th
                                    style={{
                                      ...tableHeaderStyle,
                                      textAlign: 'left',
                                      fontSize: 'var(--text-xs)',
                                      padding: 'var(--space-2) var(--space-3)',
                                    }}
                                  >
                                    Provider
                                  </th>
                                  <th
                                    style={{
                                      ...tableHeaderStyle,
                                      fontSize: 'var(--text-xs)',
                                      padding: 'var(--space-2) var(--space-3)',
                                    }}
                                  >
                                    Final Wealth
                                  </th>
                                  <th
                                    style={{
                                      ...tableHeaderStyle,
                                      fontSize: 'var(--text-xs)',
                                      padding: 'var(--space-2) var(--space-3)',
                                    }}
                                  >
                                    Trades
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionLeaderboard.map((entry, rank) => {
                                  const failedRequirement = entry.tradesCompleted < 5;
                                  return (
                                  <tr
                                    key={entry.agentId}
                                    style={{
                                      backgroundColor:
                                        rank % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                      borderLeft: failedRequirement ? '3px solid var(--error)' : 'none',
                                    }}
                                  >
                                    <td
                                      style={{
                                        ...tableCellStyle,
                                        textAlign: 'center',
                                        fontWeight: 'var(--weight-bold)',
                                        fontSize: 'var(--text-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                      }}
                                    >
                                      {rank === 0 && '🥇'}
                                      {rank === 1 && '🥈'}
                                      {rank === 2 && '🥉'}
                                      {rank > 2 && rank + 1}
                                    </td>
                                    <td
                                      style={{
                                        ...tableCellStyle,
                                        fontWeight: 'var(--weight-semibold)',
                                        fontSize: 'var(--text-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        color: failedRequirement ? 'var(--error)' : 'inherit',
                                      }}
                                    >
                                      {entry.agentName}
                                      {failedRequirement && ' ⚠️'}
                                    </td>
                                    <td
                                      style={{
                                        ...tableCellStyle,
                                        fontSize: 'var(--text-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        color: 'var(--text-secondary)',
                                      }}
                                    >
                                      {entry.provider}
                                    </td>
                                    <td
                                      style={{
                                        ...tableCellStyle,
                                        textAlign: 'center',
                                        color: 'var(--success)',
                                        fontWeight: 'var(--weight-bold)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 'var(--text-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                      }}
                                    >
                                      ₹{entry.totalWealth.toFixed(2)}
                                    </td>
                                    <td
                                      style={{
                                        ...tableCellStyle,
                                        textAlign: 'center',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 'var(--text-sm)',
                                        padding: 'var(--space-2) var(--space-3)',
                                        color: failedRequirement ? 'var(--error)' : 'inherit',
                                        fontWeight: failedRequirement ? 'var(--weight-bold)' : 'inherit',
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
  padding: '0.5rem',
  textAlign: 'center',
  fontSize: '0.875rem',
  fontWeight: 'bold',
  color: 'var(--text-secondary)',
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.5rem',
};
