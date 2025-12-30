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
  const metRequirement = agent.tradesCompleted >= agent.tradesRequired;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: metRequirement ? '1px solid var(--border-primary)' : '1px solid var(--semantic-error)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-sm)',
        transition: 'all var(--transition)',
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
        <h3 style={{
          fontSize: 'var(--font-size-primary)',
          fontWeight: 600,
          color: metRequirement ? 'var(--text-primary)' : 'var(--semantic-error)',
        }}>
          {agent.name}
        </h3>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)', marginBottom: 'var(--space-sm)' }}>
            {agent.provider}
          </p>

          {/* Cash */}
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--border-radius)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)', marginBottom: '2px' }}>
              Cash
            </p>
            <p style={{ fontSize: 'var(--font-size-primary)', fontWeight: 600, color: 'var(--semantic-success)', fontFamily: 'var(--font-mono)' }}>
              ₹{agent.cash.toFixed(2)}
            </p>
          </div>

          {/* Inventory */}
          <div style={{ marginBottom: 'var(--space-sm)' }}>
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
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--border-radius)',
                marginBottom: inventoryExpanded ? 'var(--space-sm)' : '0',
              }}
            >
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-size-secondary)',
                  fontWeight: 600,
                }}
              >
                Inventory ({Object.keys(agent.inventory).length})
              </p>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-secondary)' }}>
                {inventoryExpanded ? '▼' : '▶'}
              </span>
            </div>
            {inventoryExpanded && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)' }}>
                {Object.entries(agent.inventory).map(([good, quantity]) => (
                  <div
                    key={good}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: 'var(--space-xs)',
                      borderRadius: 'var(--border-radius)',
                    }}
                  >
                    <p style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>{good}</p>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-size-secondary)', fontFamily: 'var(--font-mono)' }}>{quantity}</p>
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
                marginBottom: 'var(--space-xs)',
              }}
            >
              <p style={{ fontSize: 'var(--font-size-secondary)', color: 'var(--text-secondary)' }}>Trades</p>
              <p
                style={{
                  fontSize: 'var(--font-size-secondary)',
                  fontWeight: 600,
                  color: metRequirement ? 'var(--semantic-success)' : 'var(--semantic-error)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {agent.tradesCompleted} / {agent.tradesRequired}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
