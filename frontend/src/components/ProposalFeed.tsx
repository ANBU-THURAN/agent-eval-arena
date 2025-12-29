import { useState } from 'react';

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

interface ProposalFeedProps {
  proposals: Proposal[];
  allProposals?: Proposal[];
  showHeader?: boolean;
  selectedAgentFilter?: string | null;
  setSelectedAgentFilter?: (agent: string | null) => void;
  filterMode?: 'from' | 'to' | 'either';
  setFilterMode?: (mode: 'from' | 'to' | 'either') => void;
  uniqueAgents?: Array<{name: string}>;
  onClose?: () => void;
}

export default function ProposalFeed({
  proposals,
  allProposals,
  showHeader = true,
  selectedAgentFilter,
  setSelectedAgentFilter,
  filterMode = 'either',
  setFilterMode,
  uniqueAgents = [],
  onClose
}: ProposalFeedProps) {
  const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set());

  const toggleProposal = (proposalId: string) => {
    setExpandedProposals(prev => {
      const next = new Set(prev);
      if (next.has(proposalId)) {
        next.delete(proposalId);
      } else {
        next.add(proposalId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'var(--success)';
      case 'rejected':
        return 'var(--error)';
      case 'countered':
        return 'var(--warning)';
      default:
        return 'var(--accent-primary)';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: showHeader ? '1rem' : '0 1rem 1rem',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showHeader && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Proposal Feed
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error)';
                e.currentTarget.style.color = 'var(--bg-primary)';
                e.currentTarget.style.borderColor = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Filter UI - only show if filter props provided */}
      {uniqueAgents.length > 0 && setSelectedAgentFilter && setFilterMode && (
        <div
          style={{
            backgroundColor: 'var(--surface-01)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)'}}>
            <label
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}
            >
              Filter:
            </label>
            <select
              value={selectedAgentFilter || ''}
              onChange={(e) => setSelectedAgentFilter(e.target.value || null)}
              style={{
                flex: '1',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <option value="">All Agents</option>
              {uniqueAgents.map((agent) => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAgentFilter && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    padding: 'var(--space-1) var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-semibold)',
                    textTransform: 'uppercase',
                    backgroundColor: filterMode === mode ? 'var(--accent-purple)' : 'transparent',
                    color: filterMode === mode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: filterMode === mode ? '1px solid var(--accent-teal)' : '1px solid var(--border-secondary)',
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
                  padding: 'var(--space-1) var(--space-2)',
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

          {selectedAgentFilter && allProposals && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              Showing <span style={{ color: 'var(--accent-orange)', fontWeight: 'var(--weight-bold)' }}>{proposals.length}</span> of <span style={{ color: 'var(--text-primary)' }}>{allProposals.length}</span> proposals
            </div>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'scroll',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {proposals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>
            No proposals yet
          </p>
        ) : (
          proposals.map((proposal) => {
            const isExpanded = expandedProposals.has(proposal.id);

            return (
              <div
                key={proposal.id}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${getStatusColor(proposal.status)}`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => toggleProposal(proposal.id)}
                data-proposal-status={proposal.status}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderLeft = '4px solid var(--accent-orange)';
                  e.currentTarget.style.paddingLeft = 'calc(0.75rem - 3px)';
                }}
                onMouseLeave={(e) => {
                  const status = e.currentTarget.getAttribute('data-proposal-status') as 'pending' | 'accepted' | 'rejected' | 'countered';
                  e.currentTarget.style.borderLeft = `1px solid ${getStatusColor(status)}`;
                  e.currentTarget.style.paddingLeft = '0.75rem';
                }}
              >
                {/* Compact Header - Always Visible */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 'bold' }}>{proposal.fromAgentName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span style={{ fontWeight: 'bold' }}>{proposal.toAgentName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 'bold',
                        color: getStatusColor(proposal.status),
                        textTransform: 'uppercase',
                      }}
                    >
                      {getStatusLabel(proposal.status)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    {/* Proposal Details */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Good: </span>
                        <span style={{ fontWeight: 'bold' }}>{proposal.goodName}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Qty: </span>
                        <span style={{ fontWeight: 'bold' }}>{proposal.quantity}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Price: </span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                          ₹{proposal.price}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                      }}
                    >
                      "{proposal.explanation}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
