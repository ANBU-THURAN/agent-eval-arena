import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import ChartCard from '../components/ChartCard';

interface AgentPerformance {
  sessionDate: string;
  [agentName: string]: number | string | null;
}

interface TradeVolume {
  good: string;
  count: number;
}

interface WinDistribution {
  agentName: string;
  wins: number;
  [key: string]: string | number;
}

interface TradingActivity {
  time: string;
  trades: number;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface LeaderboardEntry {
  agentName: string;
  agentId: string;
  totalWealth: number;
  wins: number;
  totalTrades: number;
  sessionsPlayed: number;
  averageWealth: number;
}

interface Trade {
  goodName: string;
  settledAt: string;
}

interface Good {
  id: string;
  name: string;
  unit: string;
  referencePrice: number;
}

const COLORS = [
  '#00d4ff', '#ff006e', '#8338ec', '#ffbe0b',
  '#06ffa5', '#ff5400', '#fb5607', '#3a86ff',
  '#06d6a0', '#c77dff'
];

export default function ChartsView() {
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [tradeVolumes, setTradeVolumes] = useState<TradeVolume[]>([]);
  const [winDistribution, setWinDistribution] = useState<WinDistribution[]>([]);
  const [tradingActivity, setTradingActivity] = useState<TradingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentNames, setAgentNames] = useState<string[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [showAgents, setShowAgents] = useState(false);

  useEffect(() => {
    fetchChartsData();
  }, []);

  const fetchChartsData = async () => {
    try {
      // Fetch all sessions
      const sessionsResponse = await fetch('/api/sessions');
      const sessions: Session[] = await sessionsResponse.json();
      const completedSessions = sessions
        .filter((s) => s.status === 'completed')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setTotalSessions(completedSessions.length);

      // Fetch all agents to ensure chart shows all agents
      const agentsResponse = await fetch('/api/agents');
      const agents = await agentsResponse.json();
      const allAgentNames = agents.map((agent: any) => agent.name);
      setAgentNames(allAgentNames);
      console.log('🔍 All agent names set:', allAgentNames);
      console.log('🔍 Agent names count:', allAgentNames.length);

      // Fetch all-time leaderboard for win distribution
      const leaderboardResponse = await fetch('/api/leaderboard/alltime');
      const leaderboard: LeaderboardEntry[] = await leaderboardResponse.json();

      // Win distribution data
      const winData = leaderboard
        .filter((entry) => entry.wins > 0)
        .map((entry) => ({
          agentName: entry.agentName,
          wins: entry.wins,
        }));
      setWinDistribution(winData);

      // Agent performance over time
      if (completedSessions.length > 0) {
        const performanceData: AgentPerformance[] = [];

        for (const session of completedSessions.slice(-10)) {
          // Last 10 sessions
          const sessionLeaderboard = await fetch(`/api/leaderboard/daily/${session.id}`).then((r) =>
            r.json()
          );

          const dataPoint: AgentPerformance = {
            sessionDate: new Date(session.startTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
          };

          // Initialize all agents with null values
          allAgentNames.forEach((agentName: string) => {
            dataPoint[agentName] = null;
          });

          // Override with actual values from session leaderboard
          sessionLeaderboard.forEach((entry: LeaderboardEntry) => {
            dataPoint[entry.agentName] = entry.totalWealth;
          });

          performanceData.push(dataPoint);
        }

        setAgentPerformance(performanceData);
        console.log('🔍 Performance data:', performanceData);
        console.log('🔍 First dataPoint keys:', Object.keys(performanceData[0] || {}));

        // Trade volume by good (using most recent session)
        const latestSession = completedSessions[completedSessions.length - 1];
        const tradesResponse = await fetch(`/api/trades/${latestSession.id}`);
        const trades: Trade[] = await tradesResponse.json();

        // Fetch all goods to ensure we show all goods even if not traded
        const goodsResponse = await fetch('/api/goods');
        const goods: Good[] = await goodsResponse.json();

        // Initialize volume map with all goods set to 0
        const volumeMap = new Map<string, number>();
        goods.forEach((good) => {
          volumeMap.set(good.name, 0);
        });

        // Count trades for each good
        trades.forEach((trade) => {
          const count = volumeMap.get(trade.goodName) || 0;
          volumeMap.set(trade.goodName, count + 1);
        });

        const volumes = Array.from(volumeMap.entries()).map(([good, count]) => ({
          good,
          count,
        }));
        setTradeVolumes(volumes);

        // Trading activity timeline (trades over time during session)
        const tradesByHour = new Map<string, number>();
        const sessionStart = new Date(latestSession.startTime);

        trades.forEach((trade) => {
          const tradeTime = new Date(trade.settledAt);
          const minutesFromStart = Math.floor(
            (tradeTime.getTime() - sessionStart.getTime()) / (1000 * 60)
          );
          const timeLabel = `${minutesFromStart}m`;

          const count = tradesByHour.get(timeLabel) || 0;
          tradesByHour.set(timeLabel, count + 1);
        });

        const activityData = Array.from(tradesByHour.entries())
          .map(([time, trades]) => ({
            time,
            trades,
          }))
          .sort((a, b) => parseInt(a.time) - parseInt(b.time));

        setTradingActivity(activityData);
        setTotalTrades(trades.length);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching charts data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (totalSessions === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-bold)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Performance Analytics
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          No completed sessions yet. Charts will appear once sessions are completed.
        </p>
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
        Performance Analytics
      </h2>

      {/* Stats Summary Cards */}
      <div
        style={{
          marginBottom: 'var(--space-4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-01)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
          }}
        >
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-2)',
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
            {totalSessions}
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--surface-01)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
          }}
        >
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-2)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Latest Session Trades
          </p>
          <p
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
            }}
          >
            {totalTrades}
          </p>
        </div>
        <div
          style={{
            backgroundColor: 'var(--surface-01)',
            border: '1px solid var(--border-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
          }}
        >
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-2)',
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
            {agentNames.length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Agent Performance Over Time */}
        {agentPerformance.length > 0 && (
          <ChartCard title="Agent Performance Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="sessionDate" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-02)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                {agentNames.map((agent, index) => (
                  <Line
                    key={agent}
                    type="monotone"
                    dataKey={agent}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Custom Agents Legend - Collapsible */}
            <div
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--surface-01)',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <button
                onClick={() => setShowAgents(!showAgents)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: showAgents ? 'var(--space-2)' : 0,
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    fontWeight: 'var(--weight-bold)',
                    margin: 0,
                  }}
                >
                  Agents
                </p>
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    transform: showAgents ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  ▼
                </span>
              </button>

              {showAgents && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  {agentNames.map((agent, index) => (
                    <div
                      key={agent}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2)',
                        backgroundColor: 'var(--surface-02)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '2px',
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {agent}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartCard>
        )}

        {/* Trade Volume by Good */}
        {tradeVolumes.length > 0 && (
          <ChartCard title="Trade Volume by Good">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={tradeVolumes} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis
                  dataKey="good"
                  stroke="var(--text-secondary)"
                  angle={-90}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-02)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <Bar dataKey="count" fill="var(--accent-cyan)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Win Distribution */}
        {winDistribution.length > 0 && (
          <ChartCard title="Agent Win Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winDistribution}
                  dataKey="wins"
                  nameKey="agentName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {winDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Trading Activity Timeline */}
        {tradingActivity.length > 0 && (
          <ChartCard title="Trading Activity Timeline">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={tradingActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="time" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-02)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trades"
                  stroke="var(--accent-cyan)"
                  fill="var(--accent-cyan)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
