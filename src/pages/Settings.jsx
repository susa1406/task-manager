import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { User, Lock, LogOut, Download, Shield, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSavingProfile(true)
    try {
      await updateProfile({ name: name.trim(), email: user.email })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated!')
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setSavingPwd(false)
    }
  }

  async function handleExport() {
    try {
      const [expenses, money, experiences, goals, notes] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('money_received').select('*').eq('user_id', user.id),
        supabase.from('experiences').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
      ])
      const data = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        expenses: expenses.data,
        money_received: money.data,
        experiences: experiences.data,
        goals: goals.data,
        notes: notes.data,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jarvis-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  async function handleLogout() {
    try {
      await signOut()
      toast.success('Logged out')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Manage your profile and account</div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> Profile</div>
        </div>
        <form onSubmit={handleSaveProfile}>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {(profile?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.name || 'Personal Account'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Display Name</label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Susa Sir" />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                <div className="form-hint">Email cannot be changed here</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="settings-section">
        <div className="settings-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} /> Security</div>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={savingPwd || !newPassword}>
                {savingPwd ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Appearance */}
      <div className="settings-section">
        <div className="settings-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Palette size={14} /> Appearance</div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Theme</div>
            <div className="settings-row-sub">JARVIS Dark Theme is always active</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent-red)' }} />
            <span style={{ fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>JARVIS</span>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <div className="settings-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Download size={14} /> Data</div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Export Personal Data</div>
            <div className="settings-row-sub">Download all your data as JSON</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={14} /> Export Data
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ color: 'var(--error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={14} /> Account</div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Logout</div>
            <div className="settings-row-sub">Sign out of your account</div>
          </div>
          <button className="btn btn-danger" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}
