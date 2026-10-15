import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  const { user, apiFetch, login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingMsg, setBillingMsg] = useState(null) // { type: 'success' | 'error', text }
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

  // Handle the redirect back from Stripe Checkout.
  useEffect(() => {
    const result = searchParams.get('checkout')
    if (!result) return
    const sessionId = searchParams.get('session_id')
    setSearchParams({}, { replace: true })
    if (result === 'cancelled') {
      setBillingMsg({ type: 'error', text: 'Checkout was cancelled. You have not been charged.' })
    } else if (result === 'success' && sessionId) {
      apiFetch('POST', '/billing/confirm', { session_id: sessionId })
        .then(res => {
          login(res.token, res.user)
          setBillingMsg(res.user.is_paid
            ? { type: 'success', text: 'Welcome aboard! Your membership is active.' }
            : { type: 'error', text: 'Your payment is still processing. Refresh this page in a minute.' })
        })
        .catch(ex => setBillingMsg({ type: 'error', text: ex.message }))
    }
  }, [])

  const goToBilling = async path => {
    setBillingBusy(true); setBillingMsg(null)
    try {
      const { url } = await apiFetch('POST', path)
      window.location.href = url
    } catch (ex) {
      setBillingMsg({ type: 'error', text: ex.message })
      setBillingBusy(false)
    }
  }

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
              : '⚠️ Free Account — Become a member to unlock research access'}
          </p>
        </div>
        <div className={styles.headerBtns}>
          {user?.is_paid && !user?.is_admin && (
            <button className="btn btn-ghost btn-sm" onClick={() => goToBilling('/billing/portal')} disabled={billingBusy}>
              Manage Membership
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>✉️ Send Message</button>
        </div>
      </div>

      {billingMsg && (
        <div className={`alert ${billingMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{billingMsg.text}</div>
      )}

      {/* Upgrade banner */}
      {!user?.is_paid && (
        <div className={styles.upgradeBanner}>
          <span className={styles.upgradeIcon}>🔒</span>
          <div>
            <strong>Become a Member: $10/month</strong>
            <p>Unlock the Polish and Italian vital records search, the Poland map, documents, and priority research support. Cancel anytime.</p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
            onClick={() => goToBilling('/billing/checkout')}
            disabled={billingBusy}
          >
            {billingBusy ? 'Redirecting…' : 'Join Now'}
          </button>
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

      {/* Italian Archives quick-link for paid users */}
      {user?.is_paid && (
        <div className={styles.archivePromo}>
          <div>
            <strong>🏛️ Italian Vital Records Search</strong>
            <p>Search Portale Antenati, Italy's state archive of civil birth, marriage &amp; death records.</p>
          </div>
          <Link to="/italian-archives" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            Search Archives →
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
