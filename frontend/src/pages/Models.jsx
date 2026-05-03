import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'

const MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    version: 'gpt-4o',
    icon: '🎯',
    color: '#4f8ef7',
    desc: 'Most capable GPT-4o model. Best for complex reasoning, analysis, and code generation.',
    tags: ['Chat', 'Analysis', 'Code', 'Reasoning'],
    ctx: '128K tokens',
    rpm: '500',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    version: 'gpt-4o-mini',
    icon: '⚡',
    color: '#3ecf8e',
    desc: 'Fast and cost-efficient. Best for high-throughput tasks and real-time responses.',
    tags: ['Fast', 'Lightweight', 'Chat', 'Classify'],
    ctx: '128K tokens',
    rpm: '2,000',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    version: 'gpt-4-turbo',
    icon: '🏆',
    color: '#a855f7',
    desc: 'High intelligence with vision support. Best for advanced tasks requiring deep reasoning.',
    tags: ['Complex', 'Vision', 'Research', 'Advanced'],
    ctx: '128K tokens',
    rpm: '300',
  },
]

export default function Models() {
  const showToast = useToast()
  const navigate = useNavigate()

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {MODELS.map(m => (
          <ModelCard key={m.id} model={m}
            onUse={() => {
              showToast(`🤖 Switched to ${m.name}`)
              navigate('/chat')
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ModelCard({ model: m, onUse }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--card)', borderRadius: 14, padding: 22,
        border: `1px solid ${hov ? m.color : 'var(--border)'}`,
        transition: '.2s', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, fontSize: 22,
          background: `${m.color}22`, border: `1px solid ${m.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{m.icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{m.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.version}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.5 }}>{m.desc}</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
        {m.tags.map(t => (
          <span key={t} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 5,
            background: 'rgba(255,255,255,.07)', color: 'var(--muted2)',
          }}>{t}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{m.ctx}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Context</div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{m.rpm} RPM</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rate Limit</div>
        </div>
      </div>

      <button onClick={onUse} style={{
        width: '100%', marginTop: 14, borderRadius: 9, padding: 8,
        background: `${m.color}22`, border: `1px solid ${m.color}44`,
        color: m.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${m.color}33`}
      onMouseLeave={e => e.currentTarget.style.background = `${m.color}22`}
      >Use This Model →</button>
    </div>
  )
}
