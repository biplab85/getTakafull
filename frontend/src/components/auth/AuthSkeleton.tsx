export default function AuthSkeleton() {
  return (
    <div className="auth-skeleton">
      {/* Header */}
      <div className="auth-skeleton-header">
        <div className="skel-logo" />
        <div className="skel-text" />
        <div style={{ marginLeft: 'auto' }}>
          <div className="skel-line w-40" style={{ width: 50 }} />
        </div>
      </div>

      {/* Search bar */}
      <div className="skel-search" />

      {/* Sidebar rows */}
      <div style={{ display: 'flex', gap: 12, flex: 1 }}>
        <div style={{ flex: '0 0 120px' }}>
          {Array.from({ length: 28 }, (_, i) => i + 1).map((i) => (
            <div className="skel-row" key={i}>
              <div className="skel-icon" />
              <div className="skel-line" style={{ width: `${50 + (i * 7) % 40}%` }} />
            </div>
          ))}
        </div>

        {/* Table area */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div className="skel-line" style={{ width: 70, height: 6, background: 'var(--brand-color)', opacity: 0.4, borderRadius: 4 }} />
          </div>
          <div className="skel-table">
            {Array.from({ length: 26 }, (_, i) => i + 1).map((i) => (
              <div className="skel-table-row" key={i}>
                <div className="skel-check" />
                <div className="skel-dot" style={{ background: i % 3 === 0 ? '#43e8b3' : i % 3 === 1 ? 'var(--brand-color)' : '#ccc' }} />
                <div className="skel-line" style={{ width: `${40 + (i * 11) % 30}%`, flex: 1 }} />
                <div className="skel-bar" style={{ width: `${30 + (i * 9) % 40}%`, height: 7, background: i % 4 === 0 ? '#43e8b3' : i % 4 === 1 ? 'var(--brand-color)' : i % 4 === 2 ? '#f6a623' : '#eee', borderRadius: 4, flex: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
