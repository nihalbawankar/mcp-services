import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const handleLogin = async () => {
    if (!username || !password) return
    setLoading(true)
    try {
      const res = await authAPI.login(username, password)
      login({ username, role: res.data.role || 'user' })
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials'
      showToast(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%,rgba(79,142,247,.12) 0%,transparent 60%), radial-gradient(ellipse at 70% 80%,rgba(168,85,247,.08) 0%,transparent 60%), var(--bg)',
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 48, width: 420,
        animation: 'fadeIn .3s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, marginBottom: 16,
          }}>🚀</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>MCP Platform</h1>
          <p style={{ color: 'var(--muted2)', fontSize: 14, marginTop: 4 }}>AI + DevOps System · AWS EKS</p>
        </div>

        {/* Form */}
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Password" type="password" value={password} onChange={setPassword}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', border: 'none', borderRadius: 10, padding: 13,
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            background: loading ? 'var(--muted)' : 'linear-gradient(135deg,#4f8ef7,#a855f7)',
            transition: '.2s', marginTop: 8,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, onKeyDown }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted2)', marginBottom: 7 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', background: 'var(--bg)', color: 'var(--text)',
          border: `1px solid ${focused ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none',
          transition: '.2s',
        }}
      />
    </div>
  )
}
