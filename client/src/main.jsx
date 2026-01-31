import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { SocketProvider } from './contexts/SocketContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <App />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
)
