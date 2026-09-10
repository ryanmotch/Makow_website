import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SendMessageModal from '../components/SendMessageModal'
import styles from './Account.module.css'

function fmtDT(s) {
  if (!s) return '—'
  return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MessageDetail({ msg, isInbox, onBack }) {
  const downloadAttachment = () => {
    const a = document.createElement('a')
    a.href = `data:application/octet-stream;base64,${msg.attachment_data}`
    a.download = msg.attachment_name
    a.click()
  }
  return (
    <div className={styles.msgDetail}>
      <button className={`btn btn-ghost btn-sm ${styles.backBtn}`} onClick={onBack}>← Back</button>
      <h3 className={styles.msgDetailSubject}>{msg.subject}</h3>
      <div className={styles.msgDetailMeta}>
        {isInbox ? <>From: <strong>{msg.sender_name || 'Makow Genealogy'}</strong></> : <>To: <strong>{msg.recipient_name || 'Unknown'}</strong></>}
        &nbsp;·&nbsp; {fmtDT(msg.created_at)}
      </div>
      <div className={styles.msgDetailBody}>{msg.body}</div>
      {msg.link && (
        <a href={msg.link} target="_blank" rel="noreferrer" className={styles.msgLink}>
          🔗 {msg.link}
        </a>
      )}
      {msg.attachment_name && (
        <button onClick={downloadAttachment} className={styles.attachBtn}>
          📎 {msg.attachment_name}
        </button>
      )}
    </div>
  )
}

export default function Account() {
  const { user, apiFetch } = useAuth()
  const [tab, setTab] = useState('inbox')
  const [inbox, setInbox] = useState([])
  const [sent, setSent] = useState([])
  const [openMsg, setOpenMsg] = useState(null)
  const [openMsgInbox, setOpenMsgInbox] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadMessages = () => {
    Promise.all([apiFetch('GET', '/messages/inbox'), apiFetch('GET', '/messages/sent')])
      .then(([i, s]) => { setInbox(i); setSent(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMessages() }, [])

  const openMessage = async (msg, isInbox) => {
    if (isInbox && !msg.is_read) {
      await apiFetch('PUT', `/messages/${msg.id}/read`).catch(() => {})
      setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: 1 } : m))
    }
    setOpenMsg(msg); setOpenMsgInbox(isInbox)
  }

  const unread = inbox.filter(m => !m.is_read).length
  const msgs = tab === 'inbox' ? inbox : sent

  return (
    <div className="container page">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, {user?.name}</h1>
          <p className={styles.sub}>
            {user?.is_paid
              ? '✅ Paid Member — Full research access enabled'
              : '⚠️ Free Account — Contact us to unlock research access'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>✉️ Send Message</button>
      </div>

      {/* Upgrade banner */}
      {!user?.is_paid && (
        <div className={styles.upgradeBanner}>
          <span className={styles.upgradeIcon}>🔒</span>
          <div>
            <strong>Unlock Full Research Access</strong>
            <p>Contact us to access genealogy databases, Polish vital records search, documents, and priority research support.</p>
          </div>
          <Link to="/contact" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Contact Us
          </Link>
        </div>
      )}

      {/* Polish Archives quick-link for paid users */}
      {user?.is_paid && (
        <div className={styles.archivePromo}>
          <div>
            <strong>⭐ Polish Vital Records Search</strong>
            <p>Search 55M+ scans of birth, marriage &amp; death records from Polish state archives.</p>
          </div>
          <a href="https://www.szukajwarchiwach.gov.pl/wyszukiwanie-akt-metrykalnych" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Search Archives →
          </a>
        </div>
      )}

      {/* Poland map quick-link for paid users */}
      {user?.is_paid && (
        <div className={styles.archivePromo}>
          <div>
            <strong>🗺️ Poland Map</strong>
            <p>Browse cities, towns, and villages across Poland and jump straight to the archives search for any location.</p>
          </div>
          <Link to="/polish-map" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Explore Map →
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="tabs" style={{ marginTop: '2rem' }}>
        <button className={`tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => { setTab('inbox'); setOpenMsg(null) }}>
          Inbox {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
        </button>
        <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => { setTab('sent'); setOpenMsg(null) }}>
          Sent
        </button>
      </div>

      {openMsg ? (
        <MessageDetail
          msg={openMsg}
          isInbox={openMsgInbox}
          onBack={() => setOpenMsg(null)}
        />
      ) : loading ? (
        <div className="loader-center"><div className="spinner" /></div>
      ) : msgs.length === 0 ? (
        <div className="empty">No messages yet</div>
      ) : (
        <div className={styles.msgList}>
          {msgs.map(m => (
            <div
              key={m.id}
              className={`${styles.msgItem} ${!m.is_read && tab === 'inbox' ? styles.unread : ''}`}
              onClick={() => openMessage(m, tab === 'inbox')}
            >
              <div>
                <div className={styles.msgSubject}>{m.subject}</div>
                <div className={styles.msgFrom}>
                  {tab === 'inbox' ? (m.sender_name || 'Makow Genealogy') : `To: ${m.recipient_name || 'Unknown'}`}
                </div>
              </div>
              <div className={styles.msgDate}>{fmtDT(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SendMessageModal
          onClose={() => setShowModal(false)}
          onSent={loadMessages}
        />
      )}
    </div>
  )
}
