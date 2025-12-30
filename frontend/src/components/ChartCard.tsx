interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-md)',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-primary)',
          fontWeight: 600,
          marginBottom: 'var(--space-md)',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
