import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { experienceService } from '../services/experienceService'
import { formatDate, todayISO, groupByMonth, EXPERIENCE_CATEGORIES } from '../utils/helpers'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORY_COLORS_EXP = {
  College: 'badge-red', Project: 'badge-gold', Learning: 'badge-blue',
  Personal: 'badge-gray', Event: 'badge-green', Other: 'badge-gray',
}

function ExpModal({ initial, onClose, onSave, userId }) {
  const [form, setForm] = useState(initial || { title: '', category: 'College', date: todayISO(), description: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.date) e.date = 'Date is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = { ...form, user_id: userId }
      if (initial?.id) {
        await experienceService.update(initial.id, { title: form.title, category: form.category, date: form.date, description: form.description })
        toast.success('Experience updated!')
      } else {
        await experienceService.add(payload)
        toast.success('Experience added!')
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
          <div className="modal-title">{initial?.id ? 'Edit Experience' : '+ Add Experience'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" type="text" placeholder="Completed ESP32 Project"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {EXPERIENCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description (optional)</label>
              <textarea className="form-textarea" placeholder="Describe this experience..."
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
          <div className="modal-title">Delete Experience</div>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Delete this experience? This cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Experiences() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await experienceService.getAll(user.id, {
        search: search || undefined,
        category: catFilter !== 'All' ? catFilter : undefined,
      })
      setRecords(data)
    } catch {
      toast.error('Failed to load experiences')
    } finally {
      setLoading(false)
    }
  }, [user, search, catFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await experienceService.delete(deleteTarget)
      toast.success('Experience deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const grouped = groupByMonth(records, 'date')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Life Experiences</div>
        <div className="page-subtitle">Your personal memories and milestones</div>
      </div>

      <div className="page-actions">
        <div className="filters-bar" style={{ margin: 0, flex: 1 }}>
          <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search experiences..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...EXPERIENCE_CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`filter-chip ${catFilter === cat ? 'active' : ''}`}
                onClick={() => setCatFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Experience
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h3>No experiences recorded yet</h3>
          <p>Start capturing your personal milestones and memories.</p>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Add Experience</button>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <div className="timeline-month">{month}</div>
            {items.map((exp, i) => (
              <div className="timeline-item" key={exp.id}>
                <div className="timeline-dot-col">
                  <div className="timeline-dot" />
                  {i < items.length - 1 && <div className="timeline-line" />}
                </div>
                <div style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'flex-start' }}>
                  <div className="timeline-date">{formatDate(exp.date).split(' ').slice(0, 2).join(' ')}</div>
                  <div className="timeline-content" style={{ flex: 1 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <div className="timeline-title">{exp.title}</div>
                      <div className="timeline-actions">
                        <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(exp)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-icon btn-danger btn-sm" onClick={() => setDeleteTarget(exp.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <span className={`badge ${CATEGORY_COLORS_EXP[exp.category] || 'badge-gray'}`}>{exp.category}</span>
                    {exp.description && <div className="timeline-desc" style={{ marginTop: 8 }}>{exp.description}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {modal && (
        <ExpModal
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
