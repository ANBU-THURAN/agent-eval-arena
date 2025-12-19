import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  provider: string;
}

interface ComparisonData {
  agent: Agent;
  currentSession: {
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
    wealth: number;
  } | null;
  allTimeStats: {
    totalWealth: number;
    averageWealth: number;
    sessionsPlayed: number;
    wins: number;
    totalTrades: number;
    winRate: number;
  };
  headToHead?: Record<string, {
    tradesWithAgent: number;
    totalValueSent: number;
    totalValueReceived: number;
    netProfit: number;
  }>;
}

export default function ComparisonView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch all agents
  useEffect(() => {
    fetch('http://localhost:3000/api/agents')
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error('Failed to fetch agents:', err));
  }, []);

  // Fetch current session
  useEffect(() => {
    fetch('http://localhost:3000/api/sessions/current')
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setCurrentSessionId(data.session.id);
        }
      })
      .catch((err) => console.error('Failed to fetch current session:', err));
  }, []);

  const handleAgentToggle = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agentId));
    } else if (selectedAgentIds.length < 3) {
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    }
  };

  const handleCompare = async () => {
    if (selectedAgentIds.length < 2) {
      setError('Please select at least 2 agents to compare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/agents/comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentIds: selectedAgentIds,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setComparisonData(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-bold)',
        marginBottom: 'var(--space-4)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Agent Comparison
      </h2>

      {/* Agent Selection */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          marginBottom: 'var(--space-4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Select Agents (2-3)
        </h3>

        {/* Selection Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
        }}>
          <span style={{
            backgroundColor: 'var(--accent-cyan)',
            color: 'var(--bg-primary)',
            padding: 'var(--space-1) var(--space-2)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'var(--weight-bold)',
            fontFamily: 'var(--font-mono)',
          }}>
            {selectedAgentIds.length} of 3
          </span>
          <span>agents selected</span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)'
        }}>
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentToggle(agent.id)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: selectedAgentIds.includes(agent.id)
                  ? 'var(--accent-cyan)'
                  : 'var(--surface-01)',
                border: selectedAgentIds.includes(agent.id)
                  ? '1px solid var(--accent-cyan)'
                  : '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: selectedAgentIds.includes(agent.id) ? 'var(--bg-primary)' : 'inherit',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-display)',
                fontWeight: selectedAgentIds.includes(agent.id) ? 'var(--weight-bold)' : 'var(--weight-normal)',
                transition: 'var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {selectedAgentIds.includes(agent.id) && (
                <span>✓</span>
              )}
              {agent.name} ({agent.provider})
            </button>
          ))}
        </div>
        <button
          onClick={handleCompare}
          disabled={selectedAgentIds.length < 2 || loading}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: selectedAgentIds.length < 2 || loading
              ? 'var(--surface-02)'
              : 'var(--accent-cyan)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-sm)',
            cursor: selectedAgentIds.length < 2 || loading ? 'not-allowed' : 'pointer',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-semibold)',
            color: selectedAgentIds.length < 2 || loading ? 'var(--text-secondary)' : 'var(--bg-primary)',
            transition: 'var(--transition-base)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
          onMouseEnter={(e) => {
            if (selectedAgentIds.length >= 2 && !loading) {
              e.currentTarget.style.backgroundColor = 'var(--accent-cyan)';
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedAgentIds.length >= 2 && !loading) {
              e.currentTarget.style.backgroundColor = 'var(--accent-cyan)';
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {loading ? 'Loading...' : 'Compare Agents'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--surface-02)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-3)',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-semibold)',
            marginBottom: 'var(--space-4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Comparison Results
          </h3>

          {/* Current Session Comparison */}
          {comparisonData[0].currentSession && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-semibold)',
                marginBottom: 'var(--space-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Current Session
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`,
                  gap: 'var(--space-3)',
                }}
              >
                {comparisonData.map((data) => (
                  <div
                    key={data.agent.id}
                    style={{
                      backgroundColor: 'var(--surface-01)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-secondary)',
                    }}
                  >
                    <h4 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: 'var(--space-3)',
                      fontWeight: 'var(--weight-bold)'
                    }}>
                      {data.agent.name}
                    </h4>
                    {data.currentSession && (
                      <>
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            Wealth:
                          </span>
                          <div style={{
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 'var(--weight-bold)',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--success)'
                          }}>
                            ₹{data.currentSession.wealth.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            Cash:
                          </span>
                          <div style={{
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            ₹{data.currentSession.cash.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            Trades:
                          </span>
                          <div style={{
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {data.currentSession.tradesCompleted} / {data.currentSession.tradesRequired}
                          </div>
                        </div>
                        <div>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            Inventory:
                          </span>
                          <div style={{
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--font-mono)',
                            marginTop: 'var(--space-1)'
                          }}>
                            {Object.entries(data.currentSession.inventory).map(([good, qty]) => (
                              <div key={good}>
                                {good}: {qty}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All-Time Stats Comparison */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-semibold)',
              marginBottom: 'var(--space-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              All-Time Statistics
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`,
                gap: 'var(--space-3)',
              }}
            >
              {comparisonData.map((data) => (
                <div
                  key={data.agent.id}
                  style={{
                    backgroundColor: 'var(--surface-01)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-secondary)',
                  }}
                >
                  <h4 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 'var(--space-3)',
                    fontWeight: 'var(--weight-bold)'
                  }}>
                    {data.agent.name}
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    <div>
                      <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>Sessions Played:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.allTimeStats.sessionsPlayed}</strong>
                    </div>
                    <div>
                      <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>Wins:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.allTimeStats.wins}</strong>
                    </div>
                    <div>
                      <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>Win Rate:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{(data.allTimeStats.winRate * 100).toFixed(1)}%</strong>
                    </div>
                    <div>
                      <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>Average Wealth:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{data.allTimeStats.averageWealth.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>Total Trades:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.allTimeStats.totalTrades}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
