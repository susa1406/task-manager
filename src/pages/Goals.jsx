import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { goalService } from '../services/goalService'
import { formatCurrency, formatDate, todayISO, calcGoalProgress, GOAL_STATUSES } from '../utils/helpers'
import { Plus, Edit2, Trash2, X, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = { Active: 'badge-green', Completed: 'badge-blue', Paused: 'badge-gray' }

function GoalModal({ initial, onClose, onSave, userId }) {
  const [form, setForm] = useState(initial || {
    title: '', target_amount: '', current_amount: '',
    progress_percentage: '', deadline: '', description: '', status: 'Active'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (form.target_amount && (isNaN(form.target_amount) || parseFloat(form.target_amount) < 0)) e.target_amount = 'Must be a valid amount'
    if (form.current_amount && (isNaN(form.current_amount) || parseFloat(form.current_amount) < 0)) e.current_amount = 'Must be a valid amount'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        target_amount: form.target_amount ? parseFloat(form.target_amount) : null,
        current_amount: form.current_amount ? parseFloat(form.current_amount) : null,
        progress_percentage: (!form.target_amount && form.progress_percentage) ? parseInt(form.progress_percentage) : null,
        deadline: form.deadline || null,
        description: form.description,
        status: form.status,
        user_id: userId,
      }
      if (initial?.id) {
        await goalService.update(initial.id, payload)
        toast.success('Goal updated!')
      } else {
        await goalService.add(payload)
        toast.success('Goal added!')
      }
      onSave()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const hasFinancial = !!form.target_amount

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{initial?.id ? 'Edit Goal' : '+ Add Goal'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Goal Title</label>
              <input className="form-input" type="text" placeholder="Save ₹5,000 / Learn JavaScript"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target Amount (₹) <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, fontSize: 10 }}>optional</span></label>
                <input className="form-input" type="number" min="0" step="0.01" placeholder="5000"
                  value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
                {errors.target_amount && <div className="form-error">{errors.target_amount}</div>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  {hasFinancial ? 'Current Amount (₹)' : 'Progress (%)'}
                </label>
                {hasFinancial ? (
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="3200"
                    value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
                ) : (
                  <input className="form-input" type="number" min="0" max="100" placeholder="50"
                    value={form.progress_percentage} onChange={e => setForm(f => ({ ...f, progress_percentage: e.target.value }))} />
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Deadline <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, fontSize: 10 }}>optional</span></label>
                <input className="form-input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {GOAL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, fontSize: 10 }}>optional</span></label>
              <textarea className="form-textarea" placeholder="Describe your goal..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : (initial?.id ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm-dialog">
        <div className="modal-header">
          <div className="modal-title">Delete Goal</div>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Delete this goal? This cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await goalService.getAll(user.id)
      setGoals(data)
    } catch {
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await goalService.delete(deleteTarget)
      toast.success('Goal deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = statusFilter === 'All' ? goals : goals.filter(g => g.status === statusFilter)

  function getPct(goal) {
    if (goal.target_amount && goal.current_amount !== null) {
      return calcGoalProgress(goal.current_amount, goal.target_amount)
    }
    return goal.progress_percentage || 0
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Goals</div>
        <div className="page-subtitle">Track your personal and financial goals</div>
      </div>

      <div className="page-actions">
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', ...GOAL_STATUSES].map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No active goals</h3>
          <p>Set a goal and start making progress!</p>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Add Goal</button>
        </div>
      ) : (
        <div className="goals-grid">
          {filtered.map(goal => {
            const pct = getPct(goal)
            return (
              <div className="goal-card" key={goal.id}>
                <div className="goal-card-actions">
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(goal)} title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button className="btn btn-icon btn-danger btn-sm" onClick={() => setDeleteTarget(goal.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`badge ${STATUS_COLORS[goal.status] || 'badge-gray'}`}>{goal.status}</span>
                </div>

                <div className="goal-card-title">{goal.title}</div>

                {goal.description && (
                  <div className="goal-card-desc">{goal.description}</div>
                )}

                {goal.target_amount && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {formatCurrency(goal.current_amount || 0)} / {formatCurrency(goal.target_amount)}
                  </div>
                )}

                <div className="progress-bar">
                  <div className="progress-fill gold" style={{ width: `${pct}%` }} />
                </div>

                <div className="goal-card-meta">
                  <span className="progress-percent">{pct}%</span>
                  {goal.deadline && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      Due: {formatDate(goal.deadline)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <GoalModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
          userId={user.id}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
