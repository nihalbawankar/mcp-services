import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':     'Dashboard',
  '/chat':          'AI Assistant',
  '/models':        'Model Registry',
  '/products':      'Products',
  '/users':         'Users',
  '/payments':      'Payments',
  '/control-plane': 'Control Plane',
}

export default function Topbar() {
  const { pathname } = useLocation()

  return (
    <div style={{
      height: 56, borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0,
      background: 'var(--sidebar)',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        {TITLES[pathname] || 'MCP Platform'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Pill color="green"><Dot />EKS Online</Pill>
        <Pill color="blue">9 Services Running</Pill>
      </div>
    </div>
  )
}

function Dot() {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: 'var(--green)', animation: 'pulse 2s infinite',
    }} />
  )
}

function Pill({ color, children }) {
  const styles = {
    green: { background: 'rgba(62,207,142,.12)', border: '1px solid rgba(62,207,142,.25)', color: 'var(--green)' },
    blue:  { background: 'rgba(79,142,247,.12)', border: '1px solid rgba(79,142,247,.25)', color: 'var(--blue)' },
  }
  return (
    <div style={{
      fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 5,
      ...styles[color],
    }}>{children}</div>
  )
}
