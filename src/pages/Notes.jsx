import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { noteService } from '../services/noteService'
import { formatDate, todayISO, truncate, NOTE_CATEGORIES } from '../utils/helpers'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const CAT_COLORS = {
  Personal: 'badge-red', College: 'badge-gold', Project: 'badge-blue',
  Learning: 'badge-green', Ideas: 'badge-gray', Other: 'badge-gray',
}

function NoteModal({ initial, onClose, onSave, userId }) {
  const [form, setForm] = useState(initial || { title: '', content: '', category: 'Personal', date: todayISO() })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
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
        await noteService.update(initial.id, { title: form.title, content: form.content, category: form.category, date: form.date })
        toast.success('Note updated!')
      } else {
        await noteService.add(payload)
        toast.success('Note added!')
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
          <div className="modal-title">{initial?.id ? 'Edit Note' : '+ Add Note'}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" type="text" placeholder="Project Ideas"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {NOTE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Content</label>
              <textarea className="form-textarea" style={{ minHeight: 120 }} placeholder="Write your note here..."
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
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
          <div className="modal-title">Delete Note</div>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">Delete this note? This cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function Notes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await noteService.getAll(user.id, {
        search: search || undefined,
        category: catFilter !== 'All' ? catFilter : undefined,
      })
      setNotes(data)
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [user, search, catFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await noteService.delete(deleteTarget)
      toast.success('Note deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Notes</div>
        <div className="page-subtitle">Private notes, ideas, and reminders</div>
      </div>

      <div className="page-actions">
        <div className="filters-bar" style={{ margin: 0, flex: 1 }}>
          <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...NOTE_CATEGORIES].map(cat => (
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
          <Plus size={16} /> Add Note
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No notes recorded yet</h3>
          <p>Keep your thoughts, ideas, and reminders here.</p>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Add Note</button>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div className="note-card" key={note.id}>
              <div className="note-card-header">
                <div className="note-card-title">{note.title}</div>
                <div className="note-card-actions">
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(note)} title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button className="btn btn-icon btn-danger btn-sm" onClick={() => setDeleteTarget(note.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {note.content && (
                <div className="note-card-content">{truncate(note.content, 150)}</div>
              )}
              <div className="note-card-footer">
                <span className={`badge ${CAT_COLORS[note.category] || 'badge-gray'}`}>{note.category}</span>
                <span>{formatDate(note.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <NoteModal
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
