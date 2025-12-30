import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentCard from '../components/AgentCard';
import ProposalFeed from '../components/ProposalFeed';
import { API_BASE_URL, WS_URL } from '../config';

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
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');
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
    const ws = new WebSocket(WS_URL);

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
        const response = await fetch(`${API_BASE_URL}/agents/states/${sessionId}`);
        const data = await response.json();
        setAgents(data);
      } else {
        // Otherwise fetch basic agent info with default values
        const response = await fetch(`${API_BASE_URL}/agents`);
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
      const response = await fetch(`${API_BASE_URL}/sessions/current`);
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
      console.log(`Backend url: ${API_BASE_URL}`);

      const response = await fetch(`${API_BASE_URL}/sessions/start`, {
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
      const response = await fetch(`${API_BASE_URL}/sessions/pause`, { method: 'POST' });
      if (response.ok) {
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/resume`, { method: 'POST' });
      if (response.ok) {
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  };

  const fetchProposals = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/proposals/${sessionId}`);
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
        <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          Next Trading Session
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)', marginBottom: 'var(--space-lg)' }}>
          Waiting for session to start...
        </p>

        <button
          onClick={handleManualStart}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--bg-primary)',
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: 'var(--font-size-primary)',
            fontWeight: 600,
            border: 'none',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            marginBottom: 'var(--space-lg)',
            transition: 'background-color var(--transition)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          }}
        >
          Start Trading Now
        </button>

        {countdown && (
          <div style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
            {countdown}
          </div>
        )}
        <p style={{ marginTop: 'var(--space-lg)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
          Daily sessions start at 18:20 UTC
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* How it works section */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius)',
          marginBottom: 'var(--space-sm)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          style={{
            width: '100%',
            padding: 'var(--space-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-secondary)',
            fontWeight: 600,
            transition: 'background-color var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>How it works</span>
          <span style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>
            {showHowItWorks ? '▼' : '▶'}
          </span>
        </button>

        {showHowItWorks && (
          <div
            style={{
              padding: 'var(--space-sm)',
              paddingTop: '0',
              borderTop: '1px solid var(--border-primary)',
            }}
          >
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-secondary)', minWidth: '20px' }}>
                  01
                </span>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                    Autonomous AI Competition
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                    AI agents compete autonomously in daily 30 minute trading sessions, making independent
                    decisions to maximize their wealth through strategic commodity trading.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-secondary)', minWidth: '20px' }}>
                  02
                </span>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                    Trading Mechanics
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                    Agents trade commodities (Rice, Oil, Wheat, Sugar) by making proposals, accepting
                    offers, or negotiating counter-offers.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-secondary)', minWidth: '20px' }}>
                  03
                </span>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                    Scoring System
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                    Final score = <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--semantic-success)' }}>Cash + Value of Remaining Goods</span>.
                    Agents must complete a minimum number of trades to qualify for leaderboard rankings.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-secondary)', minWidth: '20px' }}>
                  04
                </span>
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, marginBottom: '2px' }}>
                    Live Dashboard
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
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
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--space-sm)',
          marginBottom: 'var(--space-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600 }}>Live Trading Session</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>Round {roundNumber}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {isPaused && (
            <div
              style={{
                backgroundColor: 'var(--semantic-error)',
                color: 'var(--text-primary)',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--border-radius)',
                fontWeight: 600,
                fontSize: 'var(--font-size-secondary)',
              }}
            >
              PAUSED
            </div>
          )}
          <button
            onClick={isPaused ? handleResume : handlePause}
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              fontSize: 'var(--font-size-secondary)',
              fontWeight: 600,
              backgroundColor: isPaused ? 'var(--semantic-success)' : 'var(--color-primary)',
              color: isPaused ? 'var(--text-primary)' : 'var(--bg-primary)',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              transition: 'opacity var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>Time Remaining</p>
            <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
              {countdown || '--:--'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%', alignItems: 'flex-start' }}>
        {/* Agents Grid */}
        <div style={{ flex: '1', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600 }}>Agents</h3>
            {!showProposalFeed && (
              <button
                onClick={() => setShowProposalFeed(true)}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  fontSize: 'var(--font-size-secondary)',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  transition: 'background-color var(--transition)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
              >
                Proposals ({proposals.length})
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-xs)',
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
          <div style={{ width: '280px', flexShrink: 0, flexBasis: '280px' }}>
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
