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
        return 'var(--semantic-success)';
      case 'rejected':
      case 'countered':
        return 'var(--semantic-error)';
      default:
        return 'var(--color-primary)';
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--border-radius)',
        padding: showHeader ? 'var(--space-md)' : '0 var(--space-md) var(--space-md)',
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
          marginBottom: 'var(--space-sm)'
        }}>
          <h3 style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600 }}>
            Proposals
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                fontSize: 'var(--font-size-primary)',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
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
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Filter UI */}
      {uniqueAgents.length > 0 && setSelectedAgentFilter && setFilterMode && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
            <label
              style={{
                fontSize: 'var(--font-size-secondary)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
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
                <option key={agent.name} value={agent.name}>
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
                    backgroundColor:
                      filterMode === mode ? 'var(--color-primary)' : 'transparent',
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

          {selectedAgentFilter && allProposals && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {proposals.length} of {allProposals.length}
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
          gap: 'var(--space-xs)',
        }}
      >
        {proposals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-secondary)' }}>
            No proposals
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
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--space-sm)',
                  cursor: 'pointer',
                }}
                onClick={() => toggleProposal(proposal.id)}
              >
                {/* Compact Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: 'var(--font-size-secondary)' }}>
                    <span style={{ fontWeight: 600 }}>{proposal.fromAgentName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span style={{ fontWeight: 600 }}>{proposal.toAgentName}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-primary)' }}>
                    {/* Proposal Details */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--space-sm)',
                        marginBottom: 'var(--space-sm)',
                        fontSize: 'var(--font-size-secondary)',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Good: </span>
                        <span style={{ fontWeight: 600 }}>{proposal.goodName}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Qty: </span>
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{proposal.quantity}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Price: </span>
                        <span style={{ fontWeight: 600, color: 'var(--semantic-success)', fontFamily: 'var(--font-mono)' }}>
                          ₹{proposal.price}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <p
                      style={{
                        fontSize: 'var(--font-size-secondary)',
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
