import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../api'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const showToast = useToast()

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password || !form.confirm) {
      showToast('❌ All fields are required')
      return
    }
    if (form.password !== form.confirm) {
      showToast('❌ Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      showToast('❌ Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await authAPI.register(form.username, form.email, form.password)
      showToast('✅ Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed'
      showToast(`❌ ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
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
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Create Account</h1>
          <p style={{ color: 'var(--muted2)', fontSize: 14, marginTop: 4 }}>MCP Platform · AI + DevOps</p>
        </div>

        {/* Form */}
        <Field label="Username"         value={form.username} onChange={set('username')} />
        <Field label="Email"            value={form.email}    onChange={set('email')}    type="email" />
        <Field label="Password"         value={form.password} onChange={set('password')} type="password" />
        <Field label="Confirm Password" value={form.confirm}  onChange={set('confirm')}  type="password"
          onKeyDown={e => e.key === 'Enter' && handleRegister()} />

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%', border: 'none', borderRadius: 10, padding: 13,
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            background: loading ? 'var(--muted)' : 'linear-gradient(135deg,#4f8ef7,#a855f7)',
            transition: '.2s', marginTop: 8,
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
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
