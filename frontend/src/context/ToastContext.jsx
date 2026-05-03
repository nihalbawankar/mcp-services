import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ show: false, msg: '' })

  const showToast = useCallback((msg) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 3000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 28, right: 28,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 18px', fontSize: 13,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        transform: toast.show ? 'translateY(0)' : 'translateY(80px)',
        opacity: toast.show ? 1 : 0,
        transition: '.3s', zIndex: 9999,
      }}>
        {toast.msg}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
