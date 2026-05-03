import { useState, useRef, useEffect } from 'react'
import api from '../api'
import { useToast } from '../context/ToastContext'

// MCP tool definitions – these let OpenAI decide when to call platform APIs
const MCP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_products',
      description: 'List products from the MCP platform. Optionally filter by category.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by product category (optional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_users',
      description: 'List all users registered on the MCP platform.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cluster_status',
      description: 'Get live Kubernetes cluster status: pods, nodes, resource usage.',
      parameters: {
        type: 'object',
        properties: {
          namespace: { type: 'string', description: 'Kubernetes namespace (optional)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_models',
      description: 'List AI models registered in the MCP model registry.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_payment',
      description: 'Retrieve a payment record by payment ID.',
      parameters: {
        type: 'object',
        properties: {
          payment_id: { type: 'string', description: 'The payment UUID' },
        },
        required: ['payment_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product',
      description: 'Get details of a single product by its ID.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The product ID' },
        },
        required: ['product_id'],
      },
    },
  },
]

// Execute an MCP tool call by hitting the platform's API gateway
async function executeTool(name, args) {
  try {
    switch (name) {
      case 'get_products': {
        const res = await api.get('/product/products', { params: args.category ? { category: args.category } : {} })
        return JSON.stringify(res.data)
      }
      case 'get_users': {
        const res = await api.get('/user/users')
        return JSON.stringify(res.data)
      }
      case 'get_cluster_status': {
        const res = await api.get('/control-plane/status', { params: args.namespace ? { namespace: args.namespace } : {} })
        return JSON.stringify(res.data)
      }
      case 'get_models': {
        const res = await api.get('/model/models')
        return JSON.stringify(res.data)
      }
      case 'get_payment': {
        const res = await api.get(`/payment/payments/${args.payment_id}`)
        return JSON.stringify(res.data)
      }
      case 'get_product': {
        const res = await api.get(`/product/products/${args.product_id}`)
        return JSON.stringify(res.data)
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    return JSON.stringify({ error: err?.response?.data?.detail || err.message })
  }
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Chatbot() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [showKeyForm, setShowKeyForm] = useState(!localStorage.getItem('openai_api_key'))
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your MCP Chatbot powered by OpenAI. I have direct access to your platform's data — products, users, cluster status, models, and payments. Ask me anything!",
      time: now(),
      isInitial: true,
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [toolActivity, setToolActivity] = useState(null)
  const bottomRef = useRef(null)
  const showToast = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, toolActivity])

  const saveKey = () => {
    const k = keyInput.trim()
    if (!k.startsWith('sk-')) {
      showToast('Invalid API key — must start with sk-', 'error')
      return
    }
    localStorage.setItem('openai_api_key', k)
    setApiKey(k)
    setShowKeyForm(false)
    setKeyInput('')
    showToast('API key saved', 'success')
  }

  const clearKey = () => {
    localStorage.removeItem('openai_api_key')
    setApiKey('')
    setShowKeyForm(true)
    showToast('API key removed', 'info')
  }

  const send = async () => {
    const text = input.trim()
    if (!text) return
    if (!apiKey) { showToast('Please set your OpenAI API key first', 'error'); return }

    setInput('')
    const userMsg = { role: 'user', content: text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    setToolActivity(null)

    // Build conversation history for OpenAI (exclude display-only fields)
    const history = messages
      .filter(m => !m.isInitial)
      .map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    try {
      const finalReply = await runWithTools(apiKey, history, setToolActivity)
      setMessages(prev => [...prev, { role: 'assistant', content: finalReply, time: now() }])
    } catch (err) {
      const msg = err.message || 'OpenAI request failed'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}`, time: now() }])
    } finally {
      setTyping(false)
      setToolActivity(null)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 104px)', animation: 'fadeIn .2s ease' }}>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, padding: '10px 14px',
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>MCP Chatbot</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>OpenAI · MCP Tool-Calling Client</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {apiKey ? (
            <>
              <span style={{ fontSize: 11, color: 'var(--green)', background: 'rgba(62,207,142,.12)', padding: '3px 10px', borderRadius: 8 }}>
                ✓ API Key Set
              </span>
              <button onClick={() => setShowKeyForm(v => !v)} style={btnStyle('var(--blue)')}>Change Key</button>
              <button onClick={clearKey} style={btnStyle('var(--red)')}>Remove</button>
            </>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--red)', background: 'rgba(239,68,68,.12)', padding: '3px 10px', borderRadius: 8 }}>
              ✗ No API Key
            </span>
          )}
        </div>
      </div>

      {/* API key form */}
      {showKeyForm && (
        <div style={{
          marginBottom: 16, padding: '14px 16px',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          animation: 'fadeIn .2s ease',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Enter your OpenAI API Key
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            Your key is stored only in your browser's localStorage and is never sent to our servers.
            It's used directly to call the OpenAI API from your browser.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="sk-..."
              style={{
                flex: 1, background: 'var(--card2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={saveKey} style={btnStyle('var(--blue)')}>Save Key</button>
            {apiKey && <button onClick={() => setShowKeyForm(false)} style={btnStyle('var(--muted)')}>Cancel</button>}
          </div>
        </div>
      )}

      {/* MCP Tools badge bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {['Products', 'Users', 'Cluster', 'Models', 'Payments'].map(t => (
          <span key={t} style={{
            fontSize: 10, padding: '3px 9px', borderRadius: 8, fontWeight: 600,
            background: 'rgba(79,142,247,.12)', color: 'var(--blue)',
            border: '1px solid rgba(79,142,247,.25)',
          }}>⚡ {t}</span>
        ))}
        <span style={{ fontSize: 10, color: 'var(--muted)', alignSelf: 'center', marginLeft: 4 }}>
          MCP tools available
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {toolActivity && <ToolActivity activity={toolActivity} />}
        {typing && !toolActivity && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder={apiKey ? 'Ask anything — I can query products, users, cluster, models…' : 'Set your OpenAI API key above to start chatting'}
          disabled={!apiKey || typing}
          style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '13px 18px', color: 'var(--text)',
            fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit',
            maxHeight: 120, opacity: (!apiKey || typing) ? 0.5 : 1,
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={send}
          disabled={!apiKey || typing}
          style={{
            background: (!apiKey || typing)
              ? 'var(--border)'
              : 'linear-gradient(135deg,#4f8ef7,#a855f7)',
            border: 'none', borderRadius: 12, width: 48, cursor: (!apiKey || typing) ? 'not-allowed' : 'pointer',
            fontSize: 20, transition: '.2s', flexShrink: 0,
          }}
        >➤</button>
      </div>
    </div>
  )
}

// ── OpenAI tool-calling loop ──────────────────────────────────────────────────

async function runWithTools(apiKey, messages, setToolActivity) {
  const SYSTEM = `You are an intelligent assistant for the MCP Platform — a cloud-native microservices platform on Kubernetes.
You have access to live platform data via MCP tools (functions). Use them whenever the user asks about products, users, cluster status, models, or payments.
For general questions, answer from your knowledge. Always be concise and helpful.`

  let msgs = [{ role: 'system', content: SYSTEM }, ...messages]

  // Loop up to 5 rounds to handle chained tool calls
  for (let round = 0; round < 5; round++) {
    const body = {
      model: 'gpt-4o-mini',
      messages: msgs,
      tools: MCP_TOOLS,
      tool_choice: 'auto',
      max_tokens: 1024,
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `OpenAI API error ${res.status}`)
    }

    const data = await res.json()
    const choice = data.choices[0]
    const assistantMsg = choice.message

    // No tool calls — we have the final answer
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return assistantMsg.content
    }

    // Process tool calls
    msgs.push(assistantMsg)

    for (const tc of assistantMsg.tool_calls) {
      const name = tc.function.name
      let args = {}
      try { args = JSON.parse(tc.function.arguments) } catch (_) {}

      setToolActivity({ name, args })
      const result = await executeTool(name, args)

      msgs.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      })
    }
  }

  throw new Error('Tool call loop exceeded maximum rounds')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', gap: 12, maxWidth: '82%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeIn .2s ease',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        background: isUser
          ? 'linear-gradient(135deg,#3ecf8e,#06b6d4)'
          : 'linear-gradient(135deg,#4f8ef7,#a855f7)',
      }}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div>
        <div style={{
          background: isUser ? 'rgba(79,142,247,.12)' : 'var(--card2)',
          border: `1px solid ${isUser ? 'rgba(79,142,247,.25)' : 'var(--border)'}`,
          borderRadius: 14, padding: '11px 15px', fontSize: 14, lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
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

function ToolActivity({ activity }) {
  const labels = {
    get_products: 'Fetching products',
    get_users: 'Fetching users',
    get_cluster_status: 'Querying cluster status',
    get_models: 'Fetching model registry',
    get_payment: 'Looking up payment',
    get_product: 'Fetching product details',
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      alignSelf: 'flex-start', animation: 'fadeIn .2s ease',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>⚡</div>
      <div style={{
        background: 'rgba(79,142,247,.1)', border: '1px solid rgba(79,142,247,.25)',
        borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--blue)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
        {labels[activity.name] || `Running ${activity.name}`}
        {activity.args && Object.keys(activity.args).length > 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>
            ({Object.entries(activity.args).map(([k, v]) => `${k}: ${v}`).join(', ')})
          </span>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', fontSize: 14,
        background: 'linear-gradient(135deg,#4f8ef7,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>🤖</div>
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
  )
}

function btnStyle(color) {
  return {
    background: 'transparent', border: `1px solid ${color}`,
    color, borderRadius: 8, padding: '5px 12px', fontSize: 12,
    cursor: 'pointer', fontWeight: 600, transition: '.15s',
  }
}
