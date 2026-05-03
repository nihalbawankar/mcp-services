import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Chatbot from './pages/Chatbot'
import Products from './pages/Products'
import Users from './pages/Users'
import Payments from './pages/Payments'
import Models from './pages/Models'
import ControlPlane from './pages/ControlPlane'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<Dashboard />} />
              <Route path="chat"          element={<Chat />} />
              <Route path="chatbot"       element={<Chatbot />} />
              <Route path="products"      element={<Products />} />
              <Route path="users"         element={<Users />} />
              <Route path="payments"      element={<Payments />} />
              <Route path="models"        element={<Models />} />
              <Route path="control-plane" element={<ControlPlane />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
