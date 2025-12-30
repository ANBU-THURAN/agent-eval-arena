import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

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
    fetch(`${API_BASE_URL}/agents`)
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error('Failed to fetch agents:', err));
  }, []);

  // Fetch current session
  useEffect(() => {
    fetch(`${API_BASE_URL}/sessions/current`)
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
      const response = await fetch(`${API_BASE_URL}/agents/comparison`, {
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
      <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
        Agent Comparison
      </h2>

      {/* Agent Selection */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
          Select Agents (2-3)
        </h3>

        {/* Selection Counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--font-size-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--bg-primary)',
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: 'var(--border-radius)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {selectedAgentIds.length} of 3
          </span>
          <span>agents selected</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {agents.map((agent) => {
            const isSelected = selectedAgentIds.includes(agent.id);

            return (
              <button
                key={agent.id}
                onClick={() => handleAgentToggle(agent.id)}
                style={{
                  padding: 'calc(var(--space-xs) + 2px) calc(var(--space-sm) + 4px)',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',

                  backgroundColor: isSelected
                    ? 'var(--color-primary)'
                    : 'var(--bg-secondary)',

                  border: isSelected
                    ? '1px solid var(--color-primary-light)'
                    : '1px solid var(--color-primary)',

                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',

                  color: isSelected
                    ? 'var(--bg-primary)'
                    : 'var(--text-primary)',

                  fontSize: 'var(--font-size-primary)',
                  fontWeight: isSelected ? 600 : 400,
                  lineHeight: 1.2,

                  transition: 'background-color var(--transition), border-color var(--transition), color var(--transition)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }
                }}
              >
                {isSelected && '✓ '}
                {agent.name} ({agent.provider})
              </button>
            );
          })}
        </div>

        <button
          onClick={handleCompare}
          disabled={selectedAgentIds.length < 2 || loading}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: selectedAgentIds.length < 2 || loading ? 'var(--bg-tertiary)' : 'var(--color-primary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--border-radius)',
            cursor: selectedAgentIds.length < 2 || loading ? 'not-allowed' : 'pointer',
            fontSize: 'var(--font-size-secondary)',
            fontWeight: 600,
            color: selectedAgentIds.length < 2 || loading ? 'var(--text-secondary)' : 'var(--bg-primary)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={(e) => {
            if (selectedAgentIds.length >= 2 && !loading) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedAgentIds.length >= 2 && !loading) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }
          }}
        >
          {loading ? 'Loading...' : 'Compare Agents'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--semantic-error)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--space-md)',
            color: 'var(--semantic-error)',
            fontSize: 'var(--font-size-secondary)',
          }}
        >
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <div>
          <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Comparison Results
          </h3>

          {/* Current Session Comparison */}
          {comparisonData[0].currentSession && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                Current Session
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`,
                  gap: 'var(--space-sm)',
                }}
              >
                {comparisonData.map((data) => (
                  <div
                    key={data.agent.id}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    <h4 style={{ fontSize: 'var(--font-size-secondary)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                      {data.agent.name}
                    </h4>
                    {data.currentSession && (
                      <>
                        <div style={{ marginBottom: 'var(--space-xs)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                            Wealth:
                          </span>
                          <div
                            style={{
                              fontSize: 'var(--font-size-primary)',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--semantic-success)',
                            }}
                          >
                            ₹{data.currentSession.wealth.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 'var(--space-xs)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                            Cash:
                          </span>
                          <div style={{ fontSize: 'var(--font-size-secondary)', fontFamily: 'var(--font-mono)' }}>
                            ₹{data.currentSession.cash.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 'var(--space-xs)' }}>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                            Trades:
                          </span>
                          <div style={{ fontSize: 'var(--font-size-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {data.currentSession.tradesCompleted} / {data.currentSession.tradesRequired}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                            Inventory:
                          </span>
                          <div style={{ fontSize: 'var(--font-size-secondary)', fontFamily: 'var(--font-mono)', marginTop: 'var(--space-xs)' }}>
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
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              All-Time Statistics
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`,
                gap: 'var(--space-sm)',
              }}
            >
              {comparisonData.map((data) => (
                <div
                  key={data.agent.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <h4 style={{ fontSize: 'var(--font-size-secondary)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                    {data.agent.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontSize: 'var(--font-size-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Sessions Played:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.allTimeStats.sessionsPlayed}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Wins:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.allTimeStats.wins}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Win Rate:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>
                        {(data.allTimeStats.winRate * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Average Wealth:</span>{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>
                        ₹{data.allTimeStats.averageWealth.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Trades:</span>{' '}
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
