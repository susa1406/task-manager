import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { moneyService } from '../services/moneyService'
import { formatCurrency, formatDate, todayISO, MONEY_SOURCES } from '../utils/helpers'
import { Plus, Edit2, Trash2, X, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

function MoneyModal({ initial, onClose, onSave, userId }) {
  const [form, setForm] = useState(initial || { amount: '', source: 'Parents', date: todayISO(), note: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount > 0'
    if (!form.date) e.date = 'Date is required'
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
        await moneyService.update(initial.id, { amount: payload.amount, source: payload.source, date: payload.date, note: payload.note })
        toast.success('Record updated!')
      } else {
        await moneyService.add(payload)
        toast.success('Money added!')
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
          <div className="modal-title">{initial?.id ? 'Edit Record' : '+ Add Money'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" min="0.01" step="0.01" placeholder="500"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                {MONEY_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Note (optional)</label>
              <input className="form-input" type="text" placeholder="Monthly pocket money"
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
          <div className="modal-title">Delete Record</div>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Are you sure you want to delete this record? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Money() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | record obj
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [totals, setTotals] = useState({ total: 0, monthly: 0 })

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [data, total, monthly] = await Promise.all([
        moneyService.getAll(user.id),
        moneyService.getTotalReceived(user.id),
        moneyService.getMonthlyTotal(user.id),
      ])
      setRecords(data)
      setTotals({ total, monthly })
    } catch (err) {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await moneyService.delete(deleteTarget)
      toast.success('Record deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Money Received</div>
        <div className="page-subtitle">Track money you receive from family, pocket money, scholarships</div>
      </div>

      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-card-label">Total Received</div>
          <div className="summary-card-value" style={{ color: 'var(--success)' }}>{formatCurrency(totals.total)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">This Month</div>
          <div className="summary-card-value" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(totals.monthly)}</div>
        </div>
      </div>

      <div className="page-actions">
        <div className="section-title">Money Received History</div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Money
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>No records yet</h3>
          <p>Add your first money entry to get started.</p>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Add Money</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
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
                    <span className="badge badge-green">{rec.source}</span>
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(rec.amount)}</td>
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
        <MoneyModal
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
