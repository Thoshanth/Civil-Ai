import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors and format messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (server down, CORS, etc.)
    if (!error.response) {
      toast.error('Network error. Please check your connection or ensure the server is running.');
      return Promise.reject(error);
    }
    
    if (error.response.status === 401 || error.response.status === 403) {
      if (error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register')) {
        return Promise.reject(error);
      }
      useAuthStore.getState().logout()
      window.location.href = '/login'
      toast.error('Session expired or invalid. Please login again.');
      return Promise.reject(error)
    }

    // Attempt to parse standard Spring Boot error response or custom message
    const errorMessage = error.response.data?.message || error.response.data?.error || 'An unexpected error occurred';
    
    // Avoid double toasting on login attempts if we want to handle it in the component
    // But for a 'perfect' API integration, a global error toast is usually great.
    if (error.config.url !== '/auth/login' && error.config.url !== '/auth/register') {
       toast.error(errorMessage);
    }
    
    // Attach parsed message to the error object so components can use it
    error.formattedMessage = errorMessage;
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/register/verify', data),
  resendOtp: (data) => api.post('/auth/register/resend', data),
  login: (data) => api.post('/auth/login', data),
  verifyLoginOtp: (data) => api.post('/auth/login/verify', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

// Documents API
export const documentsAPI = {
  getByProject: (projectId) => api.get(`/documents/project/${projectId}`),
  upload: (projectId, file, module, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    formData.append('module', module || 'general')
    return api.post(`/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  download: (id) => api.get(`/documents/${id}/download-url`),
  delete: (id) => api.delete(`/documents/${id}`),
}

// Analysis API
export const analysisAPI = {
  geotech: (formData) => api.post('/analyze/geotech', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  boq: (formData) => api.post('/analyze/boq', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  structural: (data) => api.post('/analyze/structural/json', data),
  sitePhoto: (formData) => api.post('/analyze/site-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  iscode: (data) => api.post('/analyze/iscode/query', data),
  tender: (formData) => api.post('/analyze/tender', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export default api
