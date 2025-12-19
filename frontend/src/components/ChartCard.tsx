interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-01)',
        border: '1px solid var(--border-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        minHeight: '270px',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          marginBottom: 'var(--space-6)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
