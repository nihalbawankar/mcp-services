import { useState, useEffect } from 'react'
import { userAPI } from '../api'
import { useToast } from '../context/ToastContext'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const showToast = useToast()

  useEffect(() => {
    userAPI.list()
      .then(r => setUsers(r.data.users || []))
      .catch(() => showToast('❌ Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (u) => {
    try {
      await userAPI.delete(u.id)
      setUsers(prev => prev.filter(x => x.id !== u.id))
      showToast(`🗑️ ${u.username} removed`)
    } catch {
      showToast('❌ Failed to delete user')
    }
  }

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => showToast('✅ Use Register page to add users')} style={btnStyle}>+ Add User</button>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No users found. Register a user to get started.</div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--card2)' }}>
            <tr>
              {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', fontSize: 12, fontWeight: 600,
                  color: 'var(--muted2)', textAlign: 'left',
                  textTransform: 'uppercase', letterSpacing: '.6px',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(42,45,62,.5)' : 'none' }}
              >
                <td style={td}>
                  <span style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, marginRight: 8, verticalAlign: 'middle',
                  }}>{(u.username || u.name || '?')[0].toUpperCase()}</span>
                  {u.username || u.name}
                </td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <span style={{
                    fontSize: 11, padding: '2px 9px', borderRadius: 6, fontWeight: 600,
                    ...(u.role === 'admin'
                      ? { background: 'rgba(168,85,247,.18)', color: 'var(--purple)' }
                      : { background: 'rgba(79,142,247,.15)', color: 'var(--blue)' })
                  }}>{u.role}</span>
                </td>
                <td style={td}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td style={td}>
                  <ActionBtn color="red" onClick={() => remove(u)}>Delete</ActionBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}

const td = { padding: '13px 16px', fontSize: 13 }
const btnStyle = {
  background: 'var(--blue)', border: 'none', borderRadius: 10,
  padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

function ActionBtn({ color, onClick, children, style = {} }) {
  const colors = { blue: ['rgba(79,142,247,.15)', 'rgba(79,142,247,.3)', 'var(--blue)'],
                   red:  ['rgba(239,68,68,.1)',    'rgba(239,68,68,.2)',   'var(--red)'] }
  const [bg, border, txt] = colors[color]
  return (
    <button onClick={onClick} style={{
      background: bg, border: `1px solid ${border}`, color: txt,
      borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', ...style,
    }}>{children}</button>
  )
}
