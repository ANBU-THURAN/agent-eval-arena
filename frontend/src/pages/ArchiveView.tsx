import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface Session {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
}

export default function ArchiveView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'from' | 'to' | 'either'>('either');
  const [uniqueAgents, setUniqueAgents] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchTrades(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`);
      const data = await response.json();
      setSessions(
        data.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }))
      );
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setLoading(false);
    }
  };

  const fetchTrades = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${sessionId}`);
      const data = await response.json();
      const tradesData = data.map((t: any) => ({
        ...t,
        settledAt: new Date(t.settledAt),
      }));
      setTrades(tradesData);

      // Extract unique agents from trades
      const agentsMap = new Map<string, string>();
      tradesData.forEach((trade: any) => {
        if (trade.fromAgentId && trade.fromAgentName) {
          agentsMap.set(trade.fromAgentId, trade.fromAgentName);
        }
        if (trade.toAgentId && trade.toAgentName) {
          agentsMap.set(trade.toAgentId, trade.toAgentName);
        }
      });
      const agents = Array.from(agentsMap.entries()).map(([id, name]) => ({ id, name }));
      setUniqueAgents(agents.sort((a, b) => a.name.localeCompare(b.name)));

      // Reset filter when changing sessions
      setSelectedAgentFilter(null);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>Loading archive...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
        Session Archive
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-md)' }}>
        {/* Sessions List */}
        <div>
          <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Past Sessions
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-xs)',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            {sessions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  style={{
                    backgroundColor: selectedSession === session.id ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    border:
                      selectedSession === session.id
                        ? '1px solid var(--color-primary)'
                        : '1px solid var(--border-primary)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--space-sm)',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSession !== session.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSession !== session.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '2px', fontSize: 'var(--font-size-secondary)' }}>
                    {session.startTime.toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-secondary)',
                      marginTop: 'var(--space-xs)',
                      color: session.status === 'completed' ? 'var(--semantic-success)' : 'var(--text-secondary)',
                    }}
                  >
                    {session.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trades View */}
        <div>
          {selectedSession ? (
            <>
              <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Session Trades
              </h3>

              {/* Filter UI */}
              {uniqueAgents.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius)',
                    padding: 'var(--space-sm)',
                    marginBottom: 'var(--space-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <label style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Filter:
                    </label>
                    <select
                      value={selectedAgentFilter || ''}
                      onChange={(e) => setSelectedAgentFilter(e.target.value || null)}
                      style={{
                        flex: '1',
                        fontSize: 'var(--font-size-secondary)',
                        padding: 'var(--space-xs)',
                      }}
                    >
                      <option value="">All Agents</option>
                      {uniqueAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAgentFilter && (
                    <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                      {(['from', 'to', 'either'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFilterMode(mode)}
                          style={{
                            padding: 'var(--space-xs) var(--space-sm)',
                            fontSize: 'var(--font-size-secondary)',
                            fontWeight: 600,
                            backgroundColor: filterMode === mode ? 'var(--color-primary)' : 'transparent',
                            color: filterMode === mode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-secondary)',
                            borderRadius: 'var(--border-radius)',
                            cursor: 'pointer',
                            transition: 'all var(--transition)',
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedAgentFilter(null)}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          fontSize: 'var(--font-size-secondary)',
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          color: 'var(--semantic-error)',
                          border: '1px solid var(--semantic-error)',
                          borderRadius: 'var(--border-radius)',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--semantic-error)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--semantic-error)';
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {selectedAgentFilter && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>
                      {(() => {
                        const filteredCount = trades.filter((trade) => {
                          if (filterMode === 'from') return trade.fromAgentId === selectedAgentFilter;
                          if (filterMode === 'to') return trade.toAgentId === selectedAgentFilter;
                          return trade.fromAgentId === selectedAgentFilter || trade.toAgentId === selectedAgentFilter;
                        }).length;
                        return `${filteredCount} of ${trades.length}`;
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--border-radius)',
                  overflow: 'hidden',
                }}
              >
                {trades.length === 0 ? (
                  <p
                    style={{
                      padding: 'var(--space-lg)',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--font-size-primary)',
                    }}
                  >
                    No trades in this session
                  </p>
                ) : (
                  (() => {
                    // Apply filtering
                    const filteredTrades = selectedAgentFilter
                      ? trades.filter((trade) => {
                          if (filterMode === 'from') return trade.fromAgentId === selectedAgentFilter;
                          if (filterMode === 'to') return trade.toAgentId === selectedAgentFilter;
                          return trade.fromAgentId === selectedAgentFilter || trade.toAgentId === selectedAgentFilter;
                        })
                      : trades;

                    return (
                      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {filteredTrades.length === 0 ? (
                          <p
                            style={{
                              padding: 'var(--space-lg)',
                              textAlign: 'center',
                              color: 'var(--text-secondary)',
                              fontSize: 'var(--font-size-primary)',
                            }}
                          >
                            No trades match the current filter
                          </p>
                        ) : (
                          filteredTrades.map((trade, index) => (
                            <div
                              key={trade.id}
                              style={{
                                padding: 'var(--space-sm)',
                                borderBottom: index < filteredTrades.length - 1 ? '1px solid var(--border-primary)' : 'none',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: '4px',
                                  fontSize: 'var(--font-size-secondary)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                  <span style={{ fontWeight: 600 }}>{trade.fromAgentName}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                  <span style={{ fontWeight: 600 }}>{trade.toAgentName}</span>
                                </div>
                                <span style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                  {trade.settledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div style={{ fontSize: 'var(--font-size-secondary)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Traded: </span>
                                <span style={{ fontWeight: 600 }}>
                                  {trade.quantity} {trade.goodUnit} of {trade.goodName}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}> for </span>
                                <span style={{ fontWeight: 600, color: 'var(--semantic-success)', fontFamily: 'var(--font-mono)' }}>
                                  ₹{trade.price}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
              }}
            >
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>
                Select a session to view trades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
