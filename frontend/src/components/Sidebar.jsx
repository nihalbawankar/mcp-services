import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard',     icon: '📊', label: 'Dashboard' },
  ]},
  { section: 'AI Services', items: [
    { to: '/chat',          icon: '💬', label: 'AI Assistant',       badge: 'AI',  badgeColor: 'purple' },
    { to: '/chatbot',       icon: '🤖', label: 'Chatbot + MCP',      badge: 'NEW', badgeColor: 'blue' },
    { to: '/models',        icon: '🧠', label: 'Model Registry',     badge: 'AI',  badgeColor: 'purple' },
  ]},
  { section: 'Business', items: [
    { to: '/products',      icon: '📦', label: 'Products',           badge: '6',   badgeColor: 'green' },
    { to: '/users',         icon: '👥', label: 'Users' },
    { to: '/payments',      icon: '💳', label: 'Payments' },
  ]},
  { section: 'Platform', items: [
    { to: '/control-plane', icon: '⚙️', label: 'Control Plane' },
  ]},
]

const badgeStyle = {
  purple: { background: 'rgba(168,85,247,.2)',  color: '#a855f7' },
  green:  { background: 'rgba(62,207,142,.2)',  color: '#3ecf8e' },
  blue:   { background: 'rgba(79,142,247,.2)',  color: '#4f8ef7' },
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      width: 240, flexShrink: 0, background: 'var(--sidebar)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', height: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px', display: 'flex', alignItems: 'center',
        gap: 12, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🚀</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>MCP Platform</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>v1.0.0 · EKS</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: 1,
              padding: '10px 10px 6px',
            }}>{section}</div>
            {items.map(({ to, icon, label, badge, badgeColor }) => (
              <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, marginBottom: 2,
                    background: isActive ? 'rgba(79,142,247,.15)' : 'transparent',
                    color: isActive ? 'var(--blue)' : 'var(--muted2)',
                    transition: '.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'var(--text)' }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted2)' }}}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 10,
                        fontWeight: 700, ...badgeStyle[badgeColor],
                      }}>{badge}</span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{
        padding: '14px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: 'var(--muted)', transition: '.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >⏻</button>
      </div>
    </div>
  )
}
