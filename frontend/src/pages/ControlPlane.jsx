import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { controlPlaneAPI } from '../api'

export default function ControlPlane() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [namespaces, setNamespaces] = useState([])
  const [namespace, setNamespace] = useState(null)

  // Load available namespaces once
  useEffect(() => {
    controlPlaneAPI.namespaces()
      .then(r => {
        setNamespaces(r.data.namespaces || [])
        setNamespace(r.data.default || r.data.namespaces?.[0] || 'mcp-platform')
      })
      .catch(() => setNamespace('mcp-platform'))
  }, [])

  // Fetch status whenever namespace changes
  useEffect(() => {
    if (!namespace) return
    setLoading(true)
    setError(null)
    controlPlaneAPI.status(namespace)
      .then(r => setData(r.data))
      .catch(e => {
        const detail = e?.response?.data?.detail || e?.message || 'Unknown error'
        setError(detail)
      })
      .finally(() => setLoading(false))
  }, [namespace])

  const cluster    = data?.cluster || {}
  const pods       = data?.pods?.items || []
  const nodes      = data?.nodes?.items || []
  const metrics    = data?.metrics || {}
  const podTotal   = data?.pods?.total || 0
  const podRunning = data?.pods?.running || 0
  const nodeTotal  = data?.nodes?.total || 0
  const cpuUsed    = metrics.cpu_used_millicores || 0
  const memUsed    = metrics.memory_used_mb || 0

  const INFO = [
    { label: 'Status',            value: cluster.status || 'Unknown', color: cluster.status === 'ACTIVE' ? 'var(--green)' : 'var(--yellow)' },
    { label: 'Version',           value: `EKS ${cluster.version || 'N/A'}` },
    { label: 'Registered Models', value: String(data?.registered_models ?? 0) },
    { label: 'Namespace',         value: data?.namespace || namespace || '—' },
    { label: 'Cluster',           value: cluster.name || 'N/A' },
    { label: 'Region',            value: cluster.region || 'N/A' },
  ]

  const METRICS = [
    { label: 'CPU',       value: Math.min(cpuUsed / 40, 100),                        color: 'var(--blue)',   display: `${cpuUsed}m` },
    { label: 'Memory',    value: Math.min(memUsed / 20, 100),                        color: 'var(--purple)', display: `${memUsed} MB` },
    { label: 'Pod Count', value: (podRunning / Math.max(podTotal, 1)) * 100,         color: 'var(--green)',  display: `${podRunning} / ${podTotal}` },
    { label: 'Nodes',     value: (nodeTotal / 5) * 100,                              color: 'var(--orange)', display: `${nodeTotal} nodes` },
  ]

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>

      {/* Namespace selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Namespace:</span>
        <select
          value={namespace || ''}
          onChange={e => setNamespace(e.target.value)}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', color: 'var(--text)',
            fontSize: 13, cursor: 'pointer', outline: 'none',
          }}
        >
          {namespaces.map(ns => (
            <option key={ns} value={ns}>{ns}</option>
          ))}
        </select>
        {loading && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Loading...</span>}
        {error   && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
      </div>

      {!loading && !error && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Cluster Status */}
            <Card title="⚙️ Control Plane Status">
              {INFO.map(({ label, value, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 0', borderBottom: '1px solid rgba(42,45,62,.4)',
                }}>
                  <span style={{ fontSize: 13 }}>{label}</span>
                  <strong style={{ fontSize: 13, color: color || 'var(--text)' }}>{value}</strong>
                </div>
              ))}
            </Card>

            {/* Resource Usage */}
            <Card title="📈 Resource Usage">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
                {METRICS.map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span>{m.label}</span>
                      <span style={{ color: m.color, fontWeight: 600 }}>{m.display}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(m.value, 100)}%`, height: '100%', background: m.color, borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Nodes */}
          {nodes.length > 0 && (
            <Card title="🖥️ Nodes" style={{ marginBottom: 20 }}>
              <div style={{ marginTop: 12, overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--card2)' }}>
                    <tr>
                      {['Node Name', 'Status', 'Instance Type', 'Zone', 'Kubelet'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((n, i) => (
                      <tr key={n.name}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        style={{ borderBottom: i < nodes.length - 1 ? '1px solid rgba(42,45,62,.5)' : 'none' }}
                      >
                        <td style={td}><code style={{ fontSize: 11, color: 'var(--cyan)' }}>{n.name}</code></td>
                        <td style={td}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: n.status === 'Ready' ? 'rgba(62,207,142,.15)' : 'rgba(239,68,68,.15)', color: n.status === 'Ready' ? 'var(--green)' : 'var(--red)' }}>
                            {n.status}
                          </span>
                        </td>
                        <td style={td}>{n.instance}</td>
                        <td style={td}>{n.zone}</td>
                        <td style={td}>{n.kubelet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pods */}
          <Card title={`🐳 Pods in "${namespace}"`}>
            {pods.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No pods found in {namespace}</div>
            ) : (
              <div style={{ marginTop: 12, overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--card2)' }}>
                    <tr>
                      {['Pod Name', 'Service', 'Status', 'Restarts', 'Node'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pods.map((p, i) => (
                      <tr key={p.name}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        style={{ borderBottom: i < pods.length - 1 ? '1px solid rgba(42,45,62,.5)' : 'none' }}
                      >
                        <td style={td}><code style={{ fontSize: 11, color: 'var(--cyan)' }}>{p.name}</code></td>
                        <td style={td}>{p.service}</td>
                        <td style={td}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                            background: p.status === 'Running' ? 'rgba(62,207,142,.15)' : 'rgba(239,68,68,.15)',
                            color: p.status === 'Running' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={td}>{p.restarts}</td>
                        <td style={td}><code style={{ fontSize: 11 }}>{p.node}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

const td = { padding: '12px 14px', fontSize: 13 }
