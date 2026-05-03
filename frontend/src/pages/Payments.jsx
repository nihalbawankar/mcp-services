const STATS = [
  { label: 'Total Revenue', value: '$48,200', color: 'var(--green)' },
  { label: 'Transactions',  value: '247',     color: 'var(--blue)' },
  { label: 'Avg Order',     value: '$195',    color: 'var(--purple)' },
]

const DEMO = [
  { id:'pay-7f3a', user:'Alice Johnson', product:'ML Toolkit',      amount:'$99.99',  method:'Card',   status:'completed', date:'Apr 3, 2025' },
  { id:'pay-2b8c', user:'Bob Smith',     product:'AI Widget Pro',   amount:'$29.99',  method:'PayPal', status:'completed', date:'Apr 3, 2025' },
  { id:'pay-9d1e', user:'Carol White',   product:'DevOps Suite',    amount:'$149.99', method:'Card',   status:'pending',   date:'Apr 2, 2025' },
  { id:'pay-4a6f', user:'David Lee',     product:'Cloud Monitor',   amount:'$49.99',  method:'Card',   status:'failed',    date:'Apr 2, 2025' },
  { id:'pay-3c5b', user:'Eva Martinez',  product:'Data Pipeline',   amount:'$79.99',  method:'Bank',   status:'completed', date:'Apr 1, 2025' },
  { id:'pay-8e2d', user:'Bob Smith',     product:'API Gateway Kit', amount:'$39.99',  method:'Card',   status:'completed', date:'Apr 1, 2025' },
]

const STATUS_STYLE = {
  completed: { background: 'rgba(62,207,142,.15)',  color: 'var(--green)' },
  pending:   { background: 'rgba(234,179,8,.15)',   color: 'var(--yellow)' },
  failed:    { background: 'rgba(239,68,68,.15)',   color: 'var(--red)' },
}

export default function Payments() {
  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--card2)' }}>
            <tr>
              {['Payment ID', 'User', 'Product', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--muted2)',
                  textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.6px',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO.map((p, i) => (
              <tr key={p.id}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ borderBottom: i < DEMO.length - 1 ? '1px solid rgba(42,45,62,.5)' : 'none' }}
              >
                <td style={td}><code style={{ fontSize: 11, color: 'var(--cyan)' }}>#{p.id}</code></td>
                <td style={td}>{p.user}</td>
                <td style={td}>{p.product}</td>
                <td style={{ ...td, fontWeight: 700, color: 'var(--green)' }}>{p.amount}</td>
                <td style={td}>{p.method}</td>
                <td style={td}>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, fontWeight: 600, ...STATUS_STYLE[p.status] }}>
                    {p.status}
                  </span>
                </td>
                <td style={td}>{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const td = { padding: '13px 16px', fontSize: 13 }
