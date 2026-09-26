import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Wallet, Receipt, BookOpen,
  Target, StickyNote, Settings, Menu, X, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/money', label: 'Money', icon: Wallet },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/experiences', label: 'Experiences', icon: BookOpen },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function navTo(path) {
    navigate(path)
    setSidebarOpen(false)
  }

  function isActive(path) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">JARVIS</div>
            <div className="sidebar-logo-subtitle">Personal Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`sidebar-nav-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => navTo(path)}
            >
              <Icon className="sidebar-nav-icon" size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <div className="status-indicator">
            <div className="status-dot" />
            <div>
              <div className="status-text">SYSTEM ONLINE</div>
              <div className="status-subtext">PERSONAL DATABASE CONNECTED</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="sidebar-logo-icon" style={{ width: 30, height: 30 }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: 'var(--accent-red)' }}>JARVIS</span>
        </div>
        <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ marginTop: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
