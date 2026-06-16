import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SendMessageModal from '../components/SendMessageModal'
import styles from './Admin.module.css'

function fmtDate(s) { return s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
function fmtDT(s) { return s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

const STATUS_COLORS = { new: 'badge-red', contacted: 'badge-blue', in_progress: 'badge-blue', closed: 'badge-gray' }

export default function Admin() {
  const { apiFetch } = useAuth()
  const [tab, setTab] = useState('contacts')
  const [contacts, setContacts] = useState([])
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch('GET', '/admin/contacts'),
      apiFetch('GET', '/admin/users'),
      apiFetch('GET', '/admin/messages'),
    ]).then(([c, u, m]) => { setContacts(c); setUsers(u); setMessages(m) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const togglePaid = async (user) => {
    await apiFetch('PUT', `/admin/users/${user.id}/paid`, { is_paid: !user.is_paid })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_paid: user.is_paid ? 0 : 1 } : u))
  }

  const setContactStatus = async (id, status) => {
    await apiFetch('PUT', `/admin/contacts/${id}/status`, { status })
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  if (loading) return <div className="loader-center"><div className="spinner" /><span>Loading…</span></div>

  const stats = [
    { n: users.length, l: 'Total Users' },
    { n: users.filter(u => u.is_paid).length, l: 'Paid Members' },
    { n: contacts.length, l: 'Inquiries' },
    { n: contacts.filter(c => c.status === 'new').length, l: 'New Leads' },
    { n: messages.length, l: 'Messages Sent' },
  ]

  return (
    <div className="container page">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.sub}>Manage clients, messages, and contact submissions</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>✉️ Send Message</button>
      </div>

      <div className={styles.statsRow}>
        {stats.map(({ n, l }) => (
          <div key={l} className={styles.stat}>
            <span className={styles.statNum}>{n}</span>
            <span className={styles.statLabel}>{l}</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['contacts', `Inquiries (${contacts.length})`], ['users', `Users (${users.length})`], ['messages', 'Messages']].map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'contacts' && (
        <div className="table-wrap">
          {contacts.length === 0 ? <div className="empty">No contact submissions yet</div> : (
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Name</th><th>Email</th><th>Service</th>
                  <th>Ancestry</th><th>Budget</th><th>Status</th><th>Update</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <>
                    <tr key={c.id}>
                      <td>{fmtDate(c.created_at)}</td>
                      <td><strong>{c.name}</strong></td>
                      <td><a href={`mailto:${c.email}`} style={{ color: '#C8171A' }}>{c.email}</a></td>
                      <td>{c.service || '—'}</td>
                      <td>{c.ancestry || '—'}</td>
                      <td>{c.budget || '—'}</td>
                      <td><span className={`badge ${STATUS_COLORS[c.status] || 'badge-gray'}`}>{c.status}</span></td>
                      <td>
                        <select
                          value={c.status}
                          onChange={e => setContactStatus(c.id, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '4px 6px', width: 'auto' }}
                        >
                          {['new','contacted','in_progress','closed'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                    {c.message && (
                      <tr key={`${c.id}-msg`}>
                        <td colSpan={8} className={styles.msgRow}>
                          <em>"{c.message}"</em>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Joined</th><th>Name</th><th>Email</th><th>Access</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{fmtDate(u.created_at)}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.is_paid ? 'badge-green' : 'badge-gray'}`}>{u.is_paid ? 'Paid' : 'Free'}</span></td>
                  <td><span className={`badge ${u.is_admin ? 'badge-red' : 'badge-gray'}`}>{u.is_admin ? 'Admin' : 'User'}</span></td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_paid ? '' : 'btn-success'}`}
                      style={u.is_paid ? { background: '#6B6B6B', color: 'white' } : {}}
                      onClick={() => togglePaid(u)}
                    >
                      {u.is_paid ? 'Revoke Paid' : 'Grant Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'messages' && (
        <div className="table-wrap">
          {messages.length === 0 ? <div className="empty">No messages yet</div> : (
            <table>
              <thead>
                <tr><th>Date</th><th>From</th><th>To</th><th>Subject</th><th>Attachment</th></tr>
              </thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id}>
                    <td>{fmtDT(m.created_at)}</td>
                    <td>{m.sender_name || '—'}</td>
                    <td>{m.recipient_name || '—'}</td>
                    <td>{m.subject}</td>
                    <td>{m.attachment_name ? `📎 ${m.attachment_name}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && <SendMessageModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
