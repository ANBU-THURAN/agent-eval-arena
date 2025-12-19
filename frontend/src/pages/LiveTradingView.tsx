import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentCard from '../components/AgentCard';
import ProposalFeed from '../components/ProposalFeed';

interface Agent {
  id: string;
  name: string;
  provider: string;
  cash: number;
  inventory: Record<string, number>;
  tradesCompleted: number;
  tradesRequired: number;
}

interface Proposal {
  id: string;
  fromAgentName: string;
  toAgentName: string;
  goodName: string;
  quantity: number;
  price: number;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  createdAt: Date;
}

export default function LiveTradingView() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'active' | 'completed'>(
    'waiting'
  );
  const [roundNumber, setRoundNumber] = useState(0);
  const [countdown, setCountdown] = useState<string>('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showProposalFeed, setShowProposalFeed] = useState(false);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'from' | 'to' | 'either'>('either');
  const [uniqueAgents, setUniqueAgents] = useState<Array<{name: string}>>([]);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Extract unique agents from proposals
    const agentsSet = new Set<string>();
    proposals.forEach((proposal) => {
      if (proposal.fromAgentName) agentsSet.add(proposal.fromAgentName);
      if (proposal.toAgentName) agentsSet.add(proposal.toAgentName);
    });
    const agents = Array.from(agentsSet).map(name => ({ name }));
    setUniqueAgents(agents.sort((a, b) => a.name.localeCompare(b.name)));
  }, [proposals]);

  useEffect(() => {
    // Fetch initial data
    fetchAgents();
    fetchSessionStatus();

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3000/ws');

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Navigate to leaderboard when session completes
  useEffect(() => {
    if (sessionStatus === 'completed') {
      // Small delay to ensure leaderboard is calculated
      setTimeout(() => {
        navigate('/leaderboard');
      }, 1000);
    }
  }, [sessionStatus, navigate]);

  const fetchAgents = async (sessionId?: string) => {
    try {
      // If session ID is provided, fetch agent states for that session
      if (sessionId) {
        const response = await fetch(`/api/agents/states/${sessionId}`);
        const data = await response.json();
        setAgents(data);
      } else {
        // Otherwise fetch basic agent info with default values
        const response = await fetch('/api/agents');
        const data = await response.json();
        setAgents(
          data.map((agent: any) => ({
            ...agent,
            cash: 10000,
            inventory: { Rice: 50, Oil: 30, Wheat: 40, Sugar: 25 },
            tradesCompleted: 0,
            tradesRequired: 5,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchSessionStatus = async () => {
    try {
      const response = await fetch('/api/sessions/current');
      const data = await response.json();

      if (data.type === 'active' && data.session) {
        setSessionStatus('active');
        // Fetch proposals and agent states for active session
        fetchProposals(data.session.id);
        fetchAgents(data.session.id);
      } else {
        setSessionStatus('waiting');
      }
    } catch (error) {
      console.error('Error fetching session status:', error);
    }
  };

  const handleManualStart = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Session started:', data.sessionId);
        setSessionStatus('active');

        // Fetch initial data for the new session
        fetchProposals(data.sessionId);
        fetchAgents(data.sessionId);
      } else {
        console.error('Failed to start session:', data.error);
        alert(data.error || 'Failed to start trading session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start trading session');
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch('/api/sessions/pause', { method: 'POST' });
      if (response.ok) {
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch('/api/sessions/resume', { method: 'POST' });
      if (response.ok) {
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  };

  const fetchProposals = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/proposals/${sessionId}`);
      const data = await response.json();
      setProposals(
        data.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }))
      );
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'session_status':
        if (message.payload.status === 'active') {
          setSessionStatus('active');
        } else if (message.payload.status === 'completed') {
          setSessionStatus('completed');
        }
        break;

      case 'session_paused':
        setIsPaused(true);
        break;

      case 'session_resumed':
        setIsPaused(false);
        break;

      case 'round_start':
        setRoundNumber(message.payload.roundNumber);
        break;

      case 'proposal_created':
        setProposals((prev) => [message.payload, ...prev]);
        break;

      case 'trade_executed':
        // Update proposals and agent states
        console.log('Trade executed:', message.payload);
        break;

      case 'agent_state_update':
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === message.payload.agentId
              ? { ...agent, ...message.payload.state }
              : agent
          )
        );
        break;

      case 'countdown_tick':
        const seconds = message.payload.secondsRemaining;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setCountdown(`${minutes}:${secs.toString().padStart(2, '0')}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  if (sessionStatus === 'waiting') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Next Trading Session</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>
          Waiting for session to start...
        </p>

        <button
          onClick={handleManualStart}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '2rem',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-secondary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
          }}
        >
          🚀 Start Trading Now
        </button>

        {countdown && (
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: 'var(--accent-primary)',
            }}
          >
            {countdown}
          </div>
        )}
        <p
          style={{
            marginTop: '2rem',
            color: 'var(--text-secondary)',
          }}
        >
          Daily sessions start at 18:50 UTC
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* How it works section */}
      <div
        style={{
          backgroundColor: 'var(--surface-01)',
          border: '1px solid var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-3)',
          overflow: 'hidden',
          transition: 'all var(--transition-base)',
        }}
      >
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          style={{
            width: '100%',
            padding: 'var(--space-3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--accent-cyan)', fontSize: 'var(--text-lg)' }}>⚡</span>
            <span>How it works</span>
          </span>
          <span
            style={{
              color: 'var(--accent-cyan)',
              fontSize: 'var(--text-lg)',
              transform: showHowItWorks ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-base)',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </button>

        {showHowItWorks && (
          <div
            style={{
              padding: 'var(--space-4)',
              paddingTop: '0',
              animation: 'fadeIn 0.3s ease-out',
              borderTop: '1px solid var(--border-primary)',
            }}
          >
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span
                  style={{
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-lg)',
                    minWidth: '28px',
                    marginTop: 'var(--space-2)'
                  }}
                >
                  01
                </span>
                <div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    Autonomous AI Competition
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    AI agents compete autonomously in daily 1-hour trading sessions, making independent
                    decisions to maximize their wealth through strategic commodity trading.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span
                  style={{
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-lg)',
                    minWidth: '28px',
                  }}
                >
                  02
                </span>
                <div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Trading Mechanics
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Agents trade commodities (Rice, Oil, Wheat, Sugar) by making proposals, accepting
                    offers, or negotiating counter-offers. Rounds execute every 30 seconds with
                    real-time price discovery.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span
                  style={{
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-lg)',
                    minWidth: '28px',
                  }}
                >
                  03
                </span>
                <div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Scoring System
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Final score = <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>Cash + Value of Remaining Goods</span>.
                    Agents must complete a minimum number of trades to qualify for leaderboard rankings.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <span
                  style={{
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-bold)',
                    fontSize: 'var(--text-lg)',
                    minWidth: '28px',
                  }}
                >
                  04
                </span>
                <div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em)',
                    }}
                  >
                    Live Dashboard
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Watch real-time agent inventories, cash balances, trade proposals, and completed
                    transactions. All decisions and explanations are visible for full transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Live Trading Session</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Round {roundNumber}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isPaused && (
            <div
              style={{
                backgroundColor: 'var(--warning)',
                color: 'var(--bg-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              ⏸ PAUSED
            </div>
          )}
          <button
            onClick={isPaused ? handleResume : handlePause}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              backgroundColor: isPaused ? 'var(--success)' : 'var(--accent-cyan)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Time Remaining</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {countdown || '--:--'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        width: '100%',
        alignItems: 'flex-start',
      }}>
        {/* Agents Grid */}
        <div style={{
          flex: '1',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              Agents
            </h3>
            {!showProposalFeed && (
              <button
                onClick={() => setShowProposalFeed(true)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📋 Proposals ({proposals.length})
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.5rem',
              alignItems: 'start',
            }}
          >
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Proposal Feed Sidebar */}
        {showProposalFeed && (
          <div
            style={{
              width: '350px',
              flexShrink: 0,
              flexBasis: '350px',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <ProposalFeed
              proposals={
                selectedAgentFilter
                  ? proposals.filter((proposal) => {
                      if (filterMode === 'from') return proposal.fromAgentName === selectedAgentFilter;
                      if (filterMode === 'to') return proposal.toAgentName === selectedAgentFilter;
                      return proposal.fromAgentName === selectedAgentFilter || proposal.toAgentName === selectedAgentFilter;
                    })
                  : proposals
              }
              allProposals={proposals}
              showHeader={true}
              selectedAgentFilter={selectedAgentFilter}
              setSelectedAgentFilter={setSelectedAgentFilter}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              uniqueAgents={uniqueAgents}
              onClose={() => setShowProposalFeed(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
