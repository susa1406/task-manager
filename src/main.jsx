import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#12121f',
              color: '#e8e8f0',
              border: '1px solid rgba(220,20,20,0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#12121f' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#12121f' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
