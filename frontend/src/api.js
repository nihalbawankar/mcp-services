import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 30000,
})

export const authAPI = {
  login:    (username, password) =>
    api.post('/auth/login', { username, password }),
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
}

export const productAPI = {
  list: (category) => api.get('/product/products', { params: { category } }),
  get:  (id)       => api.get(`/product/products/${id}`),
  create: (data)   => api.post('/product/products', data),
  delete: (id)     => api.delete(`/product/products/${id}`),
}

export const userAPI = {
  list:   ()     => api.get('/user/users'),
  get:    (id)   => api.get(`/user/users/${id}`),
  create: (data) => api.post('/user/users', data),
  update: (id, data) => api.put(`/user/users/${id}`, data),
  delete: (id)   => api.delete(`/user/users/${id}`),
}

export const paymentAPI = {
  process: (data) => api.post('/payment/payments', data),
  get:     (id)   => api.get(`/payment/payments/${id}`),
  byUser:  (uid)  => api.get(`/payment/payments/user/${uid}`),
}

export const aiAPI = {
  chat:      (messages, sessionId) =>
    api.post('/ai-assistant/chat', { messages, session_id: sessionId }),
  summarize: (text)  => api.post('/ai-assistant/summarize', null, { params: { text } }),
  recommend: (data)  => api.post('/recommendation/recommend', data),
}

export const modelAPI = {
  list:      ()      => api.get('/model/models'),
  inference: (data)  => api.post('/model/inference', data),
}

export const controlPlaneAPI = {
  status:     (namespace) => api.get('/control-plane/status', { params: namespace ? { namespace } : {} }),
  namespaces: ()          => api.get('/control-plane/namespaces'),
  models:     ()          => api.get('/control-plane/models'),
  register:   (data)      => api.post('/control-plane/models/register', data),
  remove:     (id)        => api.delete(`/control-plane/models/${id}`),
}

export default api
