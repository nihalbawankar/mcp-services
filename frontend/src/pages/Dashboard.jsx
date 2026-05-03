import { useEffect, useState, useCallback } from 'react'
import Card from '../components/Card'
import { controlPlaneAPI, productAPI, userAPI } from '../api'
import api from '../api'

const HEALTH_PATHS = [
  { name: 'API Gateway',      path: null },
  { name: 'Auth Service',     path: '/auth/health' },
  { name: 'Model Service',    path: '/model/health' },
  { name: 'AI Assistant',     path: '/ai-assistant/health' },
  { name: 'Rec. Engine',      path: '/recommendation/health' },
  { name: 'Product Service',  path: '/product/health' },
  { name: 'User Service',     path: '/user/health' },
  { name: 'Payment Service',  path: '/payment/health' },
  { name: 'Control Plane',    path: '/control-plane/health' },
]

const STATUS_COLOR = {
  Running:    'var(--green)',
  Pending:    'var(--yellow)',
  Failed:     'var(--red)',
  Unknown:    'var(--muted)',
  Succeeded:  'var(--cyan)',
}

export default function Dashboard() {
  const [cluster,      setCluster]      = useState(null)
  const [products,     setProducts]     = useState(null)
  const [users,        setUsers]        = useState(null)
  const [svcStatus,    setSvcStatus]    = useState({})
  const [loading,      setLoading]      = useState(true)
  const [lastUpdate,   setLastUpdate]   = useState(null)
  const [refreshing,   setRefreshing]   = useState(false)
  const [namespaces,   setNamespaces]   = useState([])
  const [namespace,    setNamespace]    = useState('')
  const [nsLoading,    setNsLoading]    = useState(false)

  const fetchCluster = useCallback(async (ns) => {
    try {
      const res = await controlPlaneAPI.status(ns || undefined)
      setCluster(res.data)
    } catch { setCluster(null) }
  }, [])

  const fetchHealth = useCallback(async () => {
    const results = {}
    await Promise.all(HEALTH_PATHS.map(async s => {
      if (!s.path) { results[s.name] = true; return }
      try { await api.get(s.path, { timeout: 4000 }); results[s.name] = true }
      catch { results[s.name] = false }
    }))
    setSvcStatus(results)
  }, [])

  const fetchNamespaces = useCallback(async () => {
    try {
      const res = await controlPlaneAPI.namespaces()
      const list = res.data?.namespaces || []
      setNamespaces(list)
      // set default to the cluster's default namespace once loaded
      if (!namespace && res.data?.default) setNamespace(res.data.default)
    } catch {}
  }, [namespace])

  const fetchAll = useCallback(async (isRefresh = false, ns) => {
    if (isRefresh) setRefreshing(true)
    const [p, u] = await Promise.allSettled([productAPI.list(), userAPI.list()])
    if (p.status === 'fulfilled') setProducts(p.value.data)
    if (u.status === 'fulfilled') setUsers(u.value.data)
    await Promise.all([fetchCluster(ns ?? namespace), fetchHealth()])
    setLoading(false)
    setRefreshing(false)
    setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }, [fetchCluster, fetchHealth, namespace])

  // Initial load
  useEffect(() => {
    fetchNamespaces()
    fetchAll()
    const t = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line

  // Re-fetch cluster when namespace changes
  const handleNamespaceChange = async (ns) => {
    setNamespace(ns)
    setNsLoading(true)
    try {
      const res = await controlPlaneAPI.status(ns || undefined)
      setCluster(res.data)
    } catch { setCluster(null) }
    setNsLoading(false)
    setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }

  const pods       = cluster?.pods?.items?.filter(p => !p.error) ?? []
  const nodes      = cluster?.nodes?.items?.filter(n => !n.error) ?? []
  const metrics    = cluster?.metrics ?? {}
  const podRunning = cluster?.pods?.running ?? 0
  const podTotal   = cluster?.pods?.total   ?? 0
  const nodesTotal = cluster?.nodes?.total  ?? 0
  const cpuUsed    = metrics.cpu_used_millicores ?? 0
  const memUsed    = metrics.memory_used_mb      ?? 0
  const upCount    = Object.values(svcStatus).filter(Boolean).length

  const productCount = Array.isArray(products) ? products.length : '—'
  const userCount    = Array.isArray(users)     ? users.length   : '—'

  const STATS = [
    { icon: '🟢', label: 'Pods Running',      value: loading ? '…' : `${podRunning} / ${podTotal}`,   color: '#3ecf8e', sub: `${nodesTotal} node${nodesTotal !== 1 ? 's' : ''}` },
    { icon: '⚡', label: 'CPU Used',           value: loading ? '…' : `${cpuUsed}m`,                  color: '#4f8ef7', sub: 'millicores' },
    { icon: '🧠', label: 'Memory Used',        value: loading ? '…' : `${memUsed} MB`,                color: '#a855f7', sub: 'across pods' },
    { icon: '🌐', label: 'Services Up',        value: loading ? '…' : `${upCount} / ${HEALTH_PATHS.length}`, color: '#f97316', sub: 'health checks' },
    { icon: '📦', label: 'Products',           value: loading ? '…' : String(productCount),           color: '#06b6d4', sub: 'in catalog' },
    { icon: '👥', label: 'Users',              value: loading ? '…' : String(userCount),              color: '#eab308', sub: 'registered' },
  ]

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Platform Overview</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {cluster?.cluster?.name
              ? `${cluster.cluster.name} · ${cluster.cluster.region} · K8s ${cluster.cluster.version}`
              : 'Live cluster data · auto-refreshes every 30s'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Namespace selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>NAMESPACE</span>
            <div style={{ position: 'relative' }}>
              <select
                value={namespace}
                onChange={e => handleNamespaceChange(e.target.value)}
                disabled={nsLoading || namespaces.length === 0}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  color: 'var(--text)', borderRadius: 8, padding: '6px 32px 6px 12px',
                  fontSize: 12, cursor: 'pointer', outline: 'none',
                  appearance: 'none', fontWeight: 600, minWidth: 160,
                  opacity: nsLoading ? 0.6 : 1,
                }}
              >
                {namespaces.length === 0
                  ? <option value="">Loading…</option>
                  : namespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))
                }
              </select>
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: 'var(--muted)', pointerEvents: 'none',
                animation: nsLoading ? 'spin 1s linear infinite' : 'none',
                display: 'inline-block',
              }}>
                {nsLoading ? '⟳' : '▾'}
              </span>
            </div>
          </div>

          {lastUpdate && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Updated {lastUpdate}</span>
          )}
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 8, padding: '6px 14px',
              fontSize: 12, cursor: refreshing ? 'not-allowed' : 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px 18px', transition: '.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 5 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Pods + Nodes row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Pods Table */}
        <Card title={`Pods · ${podRunning} running / ${podTotal} total`}>
          {loading ? (
            <Shimmer rows={5} />
          ) : pods.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No pod data available</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
                    {['Service', 'Pod Name', 'Status', 'Restarts', 'Node'].map(h => (
                      <th key={h} style={{ padding: '0 10px 10px 0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pods.map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(42,45,62,.5)' }}>
                      <td style={{ padding: '9px 10px 9px 0', fontWeight: 600, color: 'var(--blue)' }}>{p.service}</td>
                      <td style={{ padding: '9px 10px 9px 0', color: 'var(--muted2)', fontFamily: 'monospace', fontSize: 11 }}>
                        {p.name.length > 36 ? p.name.slice(0, 36) + '…' : p.name}
                      </td>
                      <td style={{ padding: '9px 10px 9px 0' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                          background: `${STATUS_COLOR[p.status] || 'var(--muted)'}22`,
                          color: STATUS_COLOR[p.status] || 'var(--muted)',
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '9px 10px 9px 0', color: p.restarts > 0 ? 'var(--red)' : 'var(--muted2)', fontWeight: p.restarts > 0 ? 700 : 400 }}>
                        {p.restarts}
                      </td>
                      <td style={{ padding: '9px 0 9px 0', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 11 }}>
                        {(p.node || '').split('.')[0] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Nodes + Service Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nodes */}
          <Card title={`Nodes · ${nodesTotal} total`}>
            {loading ? <Shimmer rows={2} /> : nodes.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>No node data</div>
            ) : nodes.map((n, i) => (
              <div key={i} style={{
                padding: '9px 0',
                borderBottom: i < nodes.length - 1 ? '1px solid rgba(42,45,62,.5)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {n.name.split('.')[0]}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                    background: n.status === 'Ready' ? 'rgba(62,207,142,.15)' : 'rgba(239,68,68,.15)',
                    color: n.status === 'Ready' ? 'var(--green)' : 'var(--red)',
                  }}>{n.status}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                  {n.instance} · {n.zone}
                </div>
              </div>
            ))}
          </Card>

          {/* Service Health */}
          <Card title={`Services · ${upCount}/${HEALTH_PATHS.length} up`} style={{ flex: 1 }}>
            {HEALTH_PATHS.map((s, i) => {
              const up = svcStatus[s.name]
              return (
                <div key={s.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
                  borderBottom: i < HEALTH_PATHS.length - 1 ? '1px solid rgba(42,45,62,.35)' : 'none',
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: up === undefined ? 'var(--muted)' : up ? 'var(--green)' : 'var(--red)',
                    animation: up === undefined ? 'pulse 1.5s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: up ? 'var(--green)' : up === false ? 'var(--red)' : 'var(--muted)' }}>
                    {up === undefined ? '…' : up ? 'UP' : 'DOWN'}
                  </span>
                </div>
              )
            })}
          </Card>
        </div>
      </div>

      {/* Cluster info bar */}
      {cluster?.cluster && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '14px 20px', display: 'flex', gap: 32, flexWrap: 'wrap',
        }}>
          {[
            ['Cluster',    cluster.cluster.name],
            ['Status',     cluster.cluster.status,  cluster.cluster.status === 'ACTIVE' ? 'var(--green)' : 'var(--yellow)'],
            ['Region',     cluster.cluster.region],
            ['K8s',        cluster.cluster.version],
            ['Namespace',  namespace || cluster.namespace],
            ['Reg. Models',String(cluster.registered_models ?? 0)],
            ['CPU',        `${cpuUsed}m`],
            ['Memory',     `${memUsed} MB`],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--text)', marginTop: 3 }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Shimmer({ rows = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 14, borderRadius: 6,
          background: 'linear-gradient(90deg, var(--card2) 25%, var(--border) 50%, var(--card2) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          width: `${70 + (i % 3) * 10}%`,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}
