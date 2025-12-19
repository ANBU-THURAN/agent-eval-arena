import { useState } from 'react';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    provider: string;
    cash: number;
    inventory: Record<string, number>;
    tradesCompleted: number;
    tradesRequired: number;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const tradeProgress = (agent.tradesCompleted / agent.tradesRequired) * 100;
  const metRequirement = agent.tradesCompleted >= agent.tradesRequired;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: metRequirement ? '1px solid var(--border)' : '2px solid var(--error)',
        borderRadius: '8px',
        padding: expanded ? '0.5rem' : '0.4rem',
        transition: 'all 0.2s',
        boxShadow: metRequirement ? 'none' : '0 0 10px var(--error-glow)',
      }}
    >
      {/* Header - Always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: metRequirement ? 'inherit' : 'var(--error)' }}>
          {agent.name}
          {!metRequirement && ' ⚠️'}
        </h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            {agent.provider}
          </p>

          {/* Cash */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '0.4rem',
              borderRadius: '4px',
              marginBottom: '0.5rem',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Cash Balance
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
              ₹{agent.cash.toFixed(2)}
            </p>
          </div>

          {/* Inventory */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setInventoryExpanded(!inventoryExpanded);
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '0.4rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                marginBottom: inventoryExpanded ? '0.4rem' : '0',
              }}
            >
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                Inventory ({Object.keys(agent.inventory).length} items)
              </p>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {inventoryExpanded ? '▼' : '▶'}
              </span>
            </div>
            {inventoryExpanded && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {Object.entries(agent.inventory).map(([good, quantity]) => (
                  <div
                    key={good}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '0.35rem',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{good}</p>
                    <p style={{ fontWeight: 'bold' }}>{quantity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trade Progress */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trade Progress</p>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: metRequirement ? 'var(--success)' : 'var(--warning)',
                }}
              >
                {agent.tradesCompleted} / {agent.tradesRequired}
              </p>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(tradeProgress, 100)}%`,
                  height: '100%',
                  backgroundColor: metRequirement ? 'var(--success)' : 'var(--accent-primary)',
                  transition: 'width 0.5s ease-in-out',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
