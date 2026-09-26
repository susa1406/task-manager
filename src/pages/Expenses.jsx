import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { expenseService } from '../services/expenseService'
import { formatCurrency, formatDate, todayISO, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../utils/helpers'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

function ExpenseModal({ initial, onClose, onSave, userId }) {
  const [form, setForm] = useState(initial || { amount: '', category: 'Bus', date: todayISO(), note: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount > 0'
    if (!form.date) e.date = 'Date is required'
    if (!form.category) e.category = 'Category is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount), user_id: userId }
      if (initial?.id) {
        await expenseService.update(initial.id, { amount: payload.amount, category: payload.category, date: payload.date, note: payload.note })
        toast.success('Expense updated!')
      } else {
        await expenseService.add(payload)
        toast.success('Expense added!')
      }
      onSave()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{initial?.id ? 'Edit Expense' : '+ Add Expense'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min="0.01" step="0.01" placeholder="30"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Note (optional)</label>
              <input className="form-input" type="text" placeholder="College travel"
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
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
          <div className="modal-title">Delete Expense</div>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Delete this expense? This cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [totals, setTotals] = useState({ total: 0, monthly: 0, today: 0 })
  const [filters, setFilters] = useState({ category: 'All', month: '' })

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const activeFilters = {}
      if (filters.category !== 'All') activeFilters.category = filters.category
      if (filters.month) activeFilters.month = filters.month

      const [data, total, monthly, today] = await Promise.all([
        expenseService.getAll(user.id, activeFilters),
        expenseService.getTotalExpenses(user.id),
        expenseService.getMonthlyTotal(user.id),
        expenseService.getTodayTotal(user.id),
      ])
      setRecords(data)
      setTotals({ total, monthly, today })
    } catch (err) {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await expenseService.delete(deleteTarget)
      toast.success('Expense deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Expenses</div>
        <div className="page-subtitle">Track your daily spending</div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">This Month</div>
          <div className="summary-card-value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(totals.monthly)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Today</div>
          <div className="summary-card-value" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(totals.today)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">All Time Total</div>
          <div className="summary-card-value">{formatCurrency(totals.total)}</div>
        </div>
      </div>

      <div className="page-actions">
        <div className="filters-bar" style={{ margin: 0, flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...EXPENSE_CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`filter-chip ${filters.category === cat ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, category: cat }))}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="month"
            className="form-input"
            style={{ width: 160, flexShrink: 0 }}
            value={filters.month}
            onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
          />
          {filters.month && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters(f => ({ ...f, month: '' }))}>Clear</button>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>No expenses recorded yet</h3>
          <p>Start tracking your spending to see it here.</p>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Add Expense</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: CATEGORY_COLORS[rec.category] || '#78909c', flexShrink: 0 }} />
                      {rec.category}
                    </div>
                  </td>
                  <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{formatCurrency(rec.amount)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(rec.date)}</td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.note || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(rec)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-icon btn-danger btn-sm" onClick={() => setDeleteTarget(rec.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ExpenseModal
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
