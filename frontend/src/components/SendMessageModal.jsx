import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SendMessageModal({ onClose, onSent }) {
  const { apiFetch } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '', link: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    apiFetch('GET', '/users').then(setUsers).catch(() => {})
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('attachment', file)
      await apiFetch('POST', '/messages/send', fd, true)
      onSent?.()
      onClose()
    } catch (ex) { setErr(ex.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3 className="modal-title">Send Message</h3>
        {err && <div className="alert alert-error">{err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>To</label>
            <select value={form.recipient_id} onChange={set('recipient_id')} required>
              <option value="">— Select recipient —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input value={form.subject} onChange={set('subject')} required placeholder="Message subject" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea value={form.body} onChange={set('body')} required placeholder="Write your message…" />
          </div>
          <div className="form-group">
            <label>Link (optional)</label>
            <input value={form.link} onChange={set('link')} placeholder="https://…" />
          </div>
          <div className="form-group">
            <label>Attachment (optional)</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
