import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../api'
import { useToast } from '../context/ToastContext'

const SUGGESTIONS = [
  'How many pods are running in the cluster?',
  'List all products in the catalog',
  'Show me the registered users',
  'What is the cluster CPU and memory usage?',
  'Which pods have restarts?',
  'List all AI models in the registry',
  'Explain what Kubernetes HPA does',
  'Write a Python hello world',
]

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your MCP AI Assistant. I can answer general questions AND query your live platform data — products, users, cluster status, models, and payments.\n\nTry asking me anything!",
      time: now(),
      isInitial: true,
    }
  ])
  const [input, setInput]   = useState('')
  const [typing, setTyping] = useState(false)
  const [toolLog, setToolLog] = useState(null)
  const bottomRef = useRef(null)
  const showToast = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, toolLog])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')

    const userMsg = { role: 'user', content: msg, time: now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    setToolLog(null)

    try {
      const history = messages
        .concat(userMsg)
        .filter(m => !m.isInitial)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await aiAPI.chat(history)
      const data = res.data

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          time: now(),
          toolsUsed: data.tools_used || [],
        }
      ])
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to reach AI Assistant.'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${detail}`, time: now() }])
    } finally {
      setTyping(false)
      setToolLog(null)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 104px)', animation: 'fadeIn .2s ease' }}>

      {/* Mode badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Badge color="#4f8ef7" icon="🤖" label="General AI" />
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>+</span>
        <Badge color="#a855f7" icon="⚡" label="MCP Tool Calling" />
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
          · products · users · cluster · models · payments
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>

        {messages.map((m, i) => <Message key={i} msg={m} />)}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
            <Avatar />
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, background: 'var(--muted)', borderRadius: '50%',
                  animation: `tdot 1.2s infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
            <style>{`@keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only when no real conversation yet) */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 14 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '6px 14px', fontSize: 12,
              color: 'var(--muted2)', cursor: 'pointer', transition: '.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={typing}
          placeholder="Ask anything — platform data or general questions…"
          style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 18px', color: 'var(--text)',
            fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit',
            maxHeight: 120, opacity: typing ? 0.5 : 1,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={() => send()}
          disabled={typing}
          style={{
            background: typing ? 'var(--border)' : 'linear-gradient(135deg,#4f8ef7,#a855f7)',
            border: 'none', borderRadius: 12, width: 48,
            cursor: typing ? 'not-allowed' : 'pointer',
            fontSize: 20, transition: '.2s', flexShrink: 0,
          }}
        >➤</button>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', gap: 12,
      maxWidth: isUser ? '78%' : '88%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeIn .2s ease',
    }}>
      {isUser
        ? <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'linear-gradient(135deg,#3ecf8e,#06b6d4)' }}>👤</div>
        : <Avatar />
      }
      <div style={{ minWidth: 0 }}>
        {/* Tool usage chips */}
        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {msg.toolsUsed.map((t, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 10,
                background: 'rgba(168,85,247,.15)', color: '#a855f7',
                border: '1px solid rgba(168,85,247,.3)',
              }}>⚡ {TOOL_LABELS[t.tool] || t.tool}</span>
            ))}
          </div>
        )}
        <div style={{
          background: isUser ? 'rgba(79,142,247,.12)' : 'var(--card2)',
          border: `1px solid ${isUser ? 'rgba(79,142,247,.25)' : 'var(--border)'}`,
          borderRadius: 14, padding: '11px 15px', fontSize: 14, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
    }}>🤖</div>
  )
}

function Badge({ color, icon, label }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
      background: `${color}18`, color, border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {icon} {label}
    </span>
  )
}

const TOOL_LABELS = {
  get_cluster_status: 'Cluster Status',
  get_products:       'Products',
  get_product:        'Product Detail',
  get_users:          'Users',
  get_models:         'Models',
  get_payment:        'Payment',
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
