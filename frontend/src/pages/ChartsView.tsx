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
import { API_BASE_URL } from '../config';

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

// Olive green color palette for charts
const COLORS = [
  '#5a6b4a', '#759952ff', 'rgba(115, 193, 52, 1)', 'rgba(115, 245, 10, 1)',
  'rgba(198, 245, 10, 1)', 'rgba(153, 180, 46, 1)', 'rgba(106, 118, 58, 1)', 'rgba(59, 62, 46, 1)',
  'rgba(10, 245, 151, 1)', 'rgba(49, 181, 129, 1)'
];

export default function ChartsView() {
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [tradeVolumes, setTradeVolumes] = useState<TradeVolume[]>([]);
  const [winDistribution, setWinDistribution] = useState<WinDistribution[]>([]);
  const [tradingActivity, setTradingActivity] = useState<TradingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentNames, setAgentNames] = useState<string[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showAgents, setShowAgents] = useState(false);

  useEffect(() => {
    fetchChartsData();
  }, []);

  const fetchChartsData = async () => {
    try {
      // Fetch all sessions
      const sessionsResponse = await fetch(`${API_BASE_URL}/sessions`);
      const sessions: Session[] = await sessionsResponse.json();
      const completedSessions = sessions
        .filter((s) => s.status === 'completed')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setTotalSessions(completedSessions.length);

      // Fetch all agents to ensure chart shows all agents
      const agentsResponse = await fetch(`${API_BASE_URL}/agents`);
      const agents = await agentsResponse.json();
      const allAgentNames = agents.map((agent: any) => agent.name);
      setAgentNames(allAgentNames);

      // Fetch all-time leaderboard for win distribution
      const leaderboardResponse = await fetch(`${API_BASE_URL}/leaderboard/alltime`);
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
          const sessionLeaderboard = await fetch(`${API_BASE_URL}/leaderboard/daily/${session.id}`).then((r) =>
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

        // Trade volume by good (aggregate across ALL sessions)
        const allTrades: Trade[] = [];
        for (const session of completedSessions) {
          const tradesResponse = await fetch(`${API_BASE_URL}/trades/${session.id}`);
          const sessionTrades: Trade[] = await tradesResponse.json();
          allTrades.push(...sessionTrades);
        }

        // Fetch all goods to ensure we show all goods even if not traded
        const goodsResponse = await fetch(`${API_BASE_URL}/goods`);
        const goods: Good[] = await goodsResponse.json();

        // Initialize volume map with all goods set to 0
        const volumeMap = new Map<string, number>();
        goods.forEach((good) => {
          volumeMap.set(good.name, 0);
        });

        // Count trades for each good across all sessions
        allTrades.forEach((trade) => {
          const count = volumeMap.get(trade.goodName) || 0;
          volumeMap.set(trade.goodName, count + 1);
        });

        const volumes = Array.from(volumeMap.entries()).map(([good, count]) => ({
          good,
          count,
        }));
        setTradeVolumes(volumes);

        // Trading activity timeline (trades over time for latest session only)
        const latestSession = completedSessions[completedSessions.length - 1];
        const latestTradesResponse = await fetch(`${API_BASE_URL}/trades/${latestSession.id}`);
        const latestTrades: Trade[] = await latestTradesResponse.json();

        const tradesByHour = new Map<string, number>();
        const sessionStart = new Date(latestSession.startTime);

        latestTrades.forEach((trade) => {
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
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching charts data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>Loading analytics...</p>
      </div>
    );
  }

  if (totalSessions === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          Performance Analytics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-primary)' }}>
          No completed sessions yet. Charts will appear once sessions are completed.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: 'var(--font-size-header)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
        Performance Analytics
      </h2>

      {/* Charts Grid - Fixed 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-md)',
        }}
      >
        {/* Agent Performance Over Time */}
        {agentPerformance.length > 0 && (
          <ChartCard title="Agent Performance Trends">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={agentPerformance} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="sessionDate"
                  stroke="var(--text-secondary)"
                  style={{ fontSize: '12px', fontFamily: 'var(--font-primary)' }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  style={{ fontSize: '12px', fontFamily: 'var(--font-primary)' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  shared
                  isAnimationActive={false}
                  content={({ active, payload, label, coordinate }) => {
                    if (!active || !payload || !coordinate) return null;

                    return (
                      <div
                        style={{
                          position: 'fixed',
                          top: coordinate.y + 12,
                          left: coordinate.x + 12,
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--border-radius)',
                          padding: '8px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          zIndex: 9999,
                          pointerEvents: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {label}
                        </div>
                        {payload
                          .filter(p => p.value != null)
                          .map(p => (
                            <div key={p.name} style={{ color: p.stroke }}>
                              {p.name}: {p.value}
                            </div>
                          ))}
                      </div>
                    );
                  }}
                />




                {agentNames.map((agent, index) => (
                  <Line
                    key={agent}
                    type="monotone"
                    dataKey={agent}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={1.5}
                    dot={{ r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Custom Agents Legend - Collapsible */}
            <div
              style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--border-radius)',
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
                  marginBottom: showAgents ? 'var(--space-sm)' : 0,
                  color: 'var(--text-secondary)',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-secondary)', fontWeight: 600, margin: 0 }}>
                  Agents
                </p>
                <span style={{ fontSize: 'var(--font-size-secondary)' }}>
                  {showAgents ? '▼' : '▶'}
                </span>
              </button>

              {showAgents && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
                  {agentNames.map((agent, index) => (
                    <div
                      key={agent}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                        padding: 'var(--space-xs)',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-primary)' }}>
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tradeVolumes} margin={{ top: 8, right: 8, bottom: 40, left: 8 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="good"
                  stroke="var(--text-secondary)"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tick={{ fontSize: 10, fontFamily: 'var(--font-primary)' }}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12, fontFamily: 'var(--font-primary)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Win Distribution */}
        {winDistribution.length > 0 && (
          <ChartCard title="Agent Win Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={winDistribution}
                  dataKey="wins"
                  nameKey="agentName"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ agentName, percent }: any) =>
                    `${agentName} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: 'var(--text-secondary)', strokeWidth: 0.5 }}
                >
                  {winDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Trading Activity Timeline */}
        <ChartCard title="Trading Activity Timeline">
          {tradingActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tradingActivity} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12, fontFamily: 'var(--font-primary)' }}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12, fontFamily: 'var(--font-primary)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trades"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-primary)'
            }}>
              No trading activity in latest session
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
