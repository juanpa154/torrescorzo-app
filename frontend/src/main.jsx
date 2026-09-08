import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css' // ← esto es importante

// Páginas como CfdiDashboard/CfdiViewer llaman axios.get('/api/...') con ruta
// relativa. En dev, Vite la proxea a localhost:3000 (vite.config.js). En
// producción no hay proxy, así que sin esto la petición cae en el propio
// dominio de Vercel en vez de en el backend de Railway. VITE_API_URL ya
// incluye el sufijo /api (ver services/api.js), así que se lo quitamos para
// quedarnos solo con el origen.
axios.defaults.baseURL = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '')

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
