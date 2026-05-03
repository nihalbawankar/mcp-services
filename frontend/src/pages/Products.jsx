import { useState, useEffect } from 'react'
import { productAPI } from '../api'
import { useToast } from '../context/ToastContext'

const DEMO = [
  { id:'p001', name:'AI Widget Pro',   price:29.99, stock:100, category:'Hardware', emoji:'🤖', description:'Smart AI-powered widget for home automation and IoT integration.' },
  { id:'p002', name:'ML Toolkit',      price:99.99, stock:48,  category:'Software', emoji:'🧠', description:'Complete ML toolkit with pre-built models and data pipelines.' },
  { id:'p003', name:'Cloud Monitor',   price:49.99, stock:75,  category:'Software', emoji:'☁️', description:'Real-time cloud infrastructure monitoring and alerting.' },
  { id:'p004', name:'DevOps Suite',    price:149.99,stock:30,  category:'Software', emoji:'⚙️', description:'Full CI/CD platform with built-in Kubernetes deployment.' },
  { id:'p005', name:'Data Pipeline',   price:79.99, stock:60,  category:'Data',     emoji:'📊', description:'Automated ETL pipelines for major data warehouses.' },
  { id:'p006', name:'API Gateway Kit', price:39.99, stock:120, category:'Network',  emoji:'🔀', description:'Lightweight API gateway for microservices architectures.' },
]

export default function Products() {
  const [products, setProducts] = useState(DEMO)
  const [search, setSearch] = useState('')
  const showToast = useToast()

  useEffect(() => {
    productAPI.list().then(r => setProducts(r.data.products)).catch(() => {})
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} />
        <Btn onClick={() => showToast('✅ Product form coming soon!')}>+ Add Product</Btn>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onBuy={() => showToast(`🛒 ${p.name} added to cart!`)} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product: p, onBuy }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--card)', borderRadius: 14, padding: 20,
        border: `1px solid ${hov ? 'var(--blue)' : 'var(--border)'}`,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: '.2s', cursor: 'pointer',
      }}
    >
      <div style={{
        width: '100%', height: 140, borderRadius: 10, marginBottom: 14,
        background: 'rgba(79,142,247,.08)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 48,
      }}>{p.emoji || '📦'}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
      <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 12 }}>{p.description || p.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>${p.price}</span>
        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: 'rgba(79,142,247,.15)', color: 'var(--blue)', fontWeight: 600 }}>{p.category}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Stock: {p.stock} units</div>
      <button onClick={onBuy} style={{
        width: '100%', background: 'var(--blue)', border: 'none', borderRadius: 8,
        padding: '8px', color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', marginTop: 12, transition: '.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--blue2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
      >Add to Cart</button>
    </div>
  )
}

function SearchBar({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '9px 14px', width: 280,
    }}>
      <span>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search products..."
        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, flex: 1 }}
      />
    </div>
  )
}

function Btn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--blue)', border: 'none', borderRadius: 10,
      padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600,
      cursor: 'pointer', transition: '.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--blue2)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
    >{children}</button>
  )
}
