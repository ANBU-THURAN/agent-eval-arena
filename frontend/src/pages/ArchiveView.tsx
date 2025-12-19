import { useEffect, useState } from 'react';

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
      const response = await fetch('/api/sessions');
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
      const response = await fetch(`/api/trades/${sessionId}`);
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
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading archive...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Session Archive
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        {/* Sessions List */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            Past Sessions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sessions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  style={{
                    backgroundColor:
                      selectedSession === session.id
                        ? 'var(--bg-tertiary)'
                        : 'var(--bg-secondary)',
                    border:
                      selectedSession === session.id
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
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
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {session.startTime.toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      color:
                        session.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)',
                      textTransform: 'uppercase',
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
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                Session Trades
              </h3>

              {/* Filter UI */}
              {uniqueAgents.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-01)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-3)',
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: '1' }}>
                    <label
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Filter by Agent:
                    </label>
                    <select
                      value={selectedAgentFilter || ''}
                      onChange={(e) => setSelectedAgentFilter(e.target.value || null)}
                      style={{
                        flex: '1',
                        minWidth: '200px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
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
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <label
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--weight-semibold)',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Mode:
                      </label>
                      {(['from', 'to', 'either'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFilterMode(mode)}
                          style={{
                            padding: 'var(--space-2) var(--space-3)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'var(--weight-semibold)',
                            textTransform: 'uppercase',
                            backgroundColor:
                              filterMode === mode ? 'var(--accent-cyan)' : 'transparent',
                            color: filterMode === mode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border:
                              filterMode === mode
                                ? '1px solid var(--accent-cyan)'
                                : '1px solid var(--border-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedAgentFilter(null)}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          fontSize: 'var(--text-xs)',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 'var(--weight-semibold)',
                          textTransform: 'uppercase',
                          backgroundColor: 'transparent',
                          color: 'var(--error)',
                          border: '1px solid var(--error)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-base)',
                          marginLeft: 'var(--space-2)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--error)';
                          e.currentTarget.style.color = 'var(--bg-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--error)';
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {trades.length === 0 ? (
                  <p
                    style={{
                      padding: '2.5rem',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
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
                          return (
                            trade.fromAgentId === selectedAgentFilter ||
                            trade.toAgentId === selectedAgentFilter
                          );
                        })
                      : trades;

                    return (
                      <>
                        {selectedAgentFilter && (
                          <div
                            style={{
                              padding: 'var(--space-3) var(--space-4)',
                              backgroundColor: 'var(--surface-02)',
                              borderBottom: '1px solid var(--border-primary)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              Showing <span style={{ color: 'var(--accent-cyan)', fontWeight: 'var(--weight-bold)' }}>{filteredTrades.length}</span> of <span style={{ color: 'var(--text-primary)' }}>{trades.length}</span> trades
                            </span>
                            <span style={{ color: 'var(--text-tertiary)' }}>
                              Filter: {filterMode.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                          {filteredTrades.length === 0 ? (
                            <p
                              style={{
                                padding: '2rem',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              No trades match the current filter
                            </p>
                          ) : (
                            filteredTrades.map((trade, index) => (
                      <div
                        key={trade.id}
                        style={{
                          padding: '1rem',
                          borderBottom:
                            index < trades.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{trade.fromAgentName}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>→</span>
                            <span style={{ fontWeight: 'bold' }}>{trade.toAgentName}</span>
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {trade.settledAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Traded: </span>
                          <span style={{ fontWeight: 'bold' }}>
                            {trade.quantity} {trade.goodUnit} of {trade.goodName}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}> for </span>
                          <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                            ₹{trade.price}
                          </span>
                        </div>
                      </div>
                            ))
                          )}
                        </div>
                      </>
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
              <p style={{ color: 'var(--text-secondary)' }}>Select a session to view trades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
