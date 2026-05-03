export default function Card({ title, children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 22, ...style,
    }}>
      {title && <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{title}</h3>}
      {children}
    </div>
  )
}
