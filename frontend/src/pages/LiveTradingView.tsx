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
  const [nextSessionCountdown, setNextSessionCountdown] = useState<string>('');
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showProposalFeed, setShowProposalFeed] = useState(false);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'from' | 'to' | 'either'>('either');
  const [uniqueAgents, setUniqueAgents] = useState<Array<{name: string}>>([]);
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

        // Start countdown to next session if provided
        if (data.nextSessionTime) {
          startNextSessionCountdown(new Date(data.nextSessionTime));
        }
      }
    } catch (error) {
      console.error('Error fetching session status:', error);
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

  const startNextSessionCountdown = (nextSessionTime: Date) => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextSessionTime.getTime() - now.getTime();

      if (diff <= 0) {
        setNextSessionCountdown('Starting soon...');
        fetchSessionStatus();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setNextSessionCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setNextSessionCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup function
    return () => clearInterval(interval);
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

  return (
    <div style={{ width: '100%' }}>
      {/* How it works section - shown in all states */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--border-radius)',
          marginBottom: 'var(--space-sm)',
          overflow: 'visible',
          position: 'relative',
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
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderTop: 'none',
              borderRadius: '0 0 var(--border-radius) var(--border-radius)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
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

      {/* Conditional content based on session status */}
      {sessionStatus === 'waiting' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            marginTop: 'var(--space-lg)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            Previous sessions and trades can be seen in Archive
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)', marginBottom: 'var(--space-md)' }}>
            Waiting for next session to start...
          </p>

          {nextSessionCountdown && (
            <div style={{
              fontSize: 'var(--font-size-header)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 'var(--space-md)'
            }}>
              {nextSessionCountdown}
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>
            Daily sessions start at 18:20 UTC
          </p>
        </div>
      ) : (
        <>
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
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>Time Remaining</p>
          <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
            {countdown || '--:--'}
          </p>
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
        </>
      )}
    </div>
  );
}
