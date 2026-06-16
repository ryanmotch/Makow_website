import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import styles from './PolishSearch.module.css'

const RECORD_TYPES = [
  { value: '', label: 'All record types' },
  { value: 'birth', label: 'Births (Urodzenia)' },
  { value: 'marriage', label: 'Marriages (Małżeństwa)' },
  { value: 'death', label: 'Deaths (Zgony)' },
]

const DIRECT_URL = 'https://www.szukajwarchiwach.gov.pl/en/wyszukiwanie-akt-metrykalnych'

export default function PolishSearch() {
  const { user, token } = useAuth()

  const [form, setForm] = useState({
    surname: '',
    parish: '',
    year_from: '',
    year_to: '',
    record_type: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [iframeUrl, setIframeUrl] = useState(null)

  // Not logged in
  if (!user) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <span className={styles.gateIcon}>🔒</span>
          <h2>Sign In Required</h2>
          <p>Please <Link to="/login">log in</Link> to access Polish Archives search.</p>
        </div>
      </div>
    )
  }

  // Logged in but not premium
  if (!user.is_paid) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateCard}>
          <span className={styles.gateIcon}>⭐</span>
          <h2>Premium Feature</h2>
          <p>
            Polish vital records search through the national archives at{' '}
            <strong>Szukaj w Archiwach</strong> is available to premium members only.
          </p>
          <p>
            This database contains over <strong>55 million scans</strong> of birth, marriage,
            and death records from Polish state and church archives — including the PRADZIAD index
            of metrical books.
          </p>
          <Link to="/contact" className={styles.upgradeBtn}>
            Contact Us to Upgrade
          </Link>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSearch(e) {
    e.preventDefault()
    setError(null)
    setIframeUrl(null)
    setLoading(true)

    // Build query params for our proxy
    const params = new URLSearchParams()
    if (form.surname) params.set('surname', form.surname)
    if (form.parish) params.set('parish', form.parish)
    if (form.year_from) params.set('year_from', form.year_from)
    if (form.year_to) params.set('year_to', form.year_to)
    if (form.record_type) params.set('record_type', form.record_type)

    // Try proxy first; fall back to direct link
    try {
      const res = await fetch(`/api/archives/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        // Use the proxy URL as iframe src (auth header can't be passed to iframe,
        // so we open the direct site in a new tab for actual browsing)
        setIframeUrl(buildDirectUrl(form))
      } else {
        const data = await res.json()
        setError(data.error || 'Search failed')
        if (data.directUrl) setIframeUrl(data.directUrl)
      }
    } catch {
      // Network error – just send to direct site
      setIframeUrl(buildDirectUrl(form))
    } finally {
      setLoading(false)
    }
  }

  function buildDirectUrl(f) {
    // The PRADZIAD search on szukajwarchiwach uses keyword search
    const params = new URLSearchParams()
    if (f.surname) {
      params.set('_com_liferay_portal_search_web_portlet_SearchPortlet_keywords', f.surname + (f.parish ? ` ${f.parish}` : ''))
    }
    return `https://www.szukajwarchiwach.gov.pl/en/wyszukiwanie-akt-metrykalnych?${params.toString()}`
  }

  function openDirect() {
    window.open(buildDirectUrl(form), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.badge}>⭐ Premium</div>
          <h1>Polish Vital Records Search</h1>
          <p className={styles.subtitle}>
            Search birth, marriage &amp; death records from Polish state and church archives via{' '}
            <a href={DIRECT_URL} target="_blank" rel="noopener noreferrer">
              Szukaj w Archiwach
            </a>{' '}
            — the national Polish archive portal with over 55 million scans.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Search form */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="surname">Surname / Keyword</label>
              <input
                id="surname"
                name="surname"
                type="text"
                value={form.surname}
                onChange={handleChange}
                placeholder="e.g. Kowalski, Nowak"
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="parish">Parish / Town</label>
              <input
                id="parish"
                name="parish"
                type="text"
                value={form.parish}
                onChange={handleChange}
                placeholder="e.g. Warszawa, Kraków"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="record_type">Record Type</label>
              <select id="record_type" name="record_type" value={form.record_type} onChange={handleChange}>
                {RECORD_TYPES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.yearRange}>
              <div className={styles.field}>
                <label htmlFor="year_from">Year From</label>
                <input
                  id="year_from"
                  name="year_from"
                  type="number"
                  value={form.year_from}
                  onChange={handleChange}
                  placeholder="e.g. 1800"
                  min="1600"
                  max="1950"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="year_to">Year To</label>
                <input
                  id="year_to"
                  name="year_to"
                  type="number"
                  value={form.year_to}
                  onChange={handleChange}
                  placeholder="e.g. 1920"
                  min="1600"
                  max="1950"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.searchBtn} disabled={loading}>
              {loading ? 'Searching…' : '🔍 Search Polish Archives'}
            </button>
            <button type="button" className={styles.directBtn} onClick={openDirect}>
              ↗ Open in New Tab
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className={styles.tips}>
          <h3>Search Tips</h3>
          <ul>
            <li>Enter surnames in Polish spelling — e.g. <em>Kowalski</em>, <em>Wiśniewski</em>, <em>Wróbel</em></li>
            <li>The PRADZIAD database indexes <strong>which archive holds which parish books</strong>, not individual names</li>
            <li>Search by village or parish name to find what records survive and where they're held</li>
            <li>Records are in Polish, Latin, Russian or German depending on the era and region</li>
            <li>Use <strong>Open in New Tab</strong> for full interactive access including document scans</li>
          </ul>
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Note:</strong> {error}
          </div>
        )}

        {/* Iframe viewer */}
        {iframeUrl && (
          <div className={styles.iframeSection}>
            <div className={styles.iframeHeader}>
              <span>Szukaj w Archiwach — Results</span>
              <div className={styles.iframeActions}>
                <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className={styles.openLink}>
                  ↗ Open full site
                </a>
              </div>
            </div>
            <div className={styles.iframeNotice}>
              <strong>Note:</strong> The Polish Archives portal may block embedding due to security headers.
              If the frame below is blank, use <strong>Open full site</strong> to search directly —
              you will have full access to all records and scans.
            </div>
            <iframe
              src={iframeUrl}
              title="Polish Archives Search"
              className={styles.iframe}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
          </div>
        )}

        {/* Direct access card */}
        <div className={styles.directCard}>
          <div className={styles.directCardContent}>
            <div>
              <h3>Direct Archive Access</h3>
              <p>
                For the full search experience — including advanced filters, document scans, and the
                complete PRADZIAD metrical records index — visit the official portal directly.
                Your premium membership covers our research assistance; the archive itself is free to search.
              </p>
            </div>
            <a
              href={DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.directCardBtn}
            >
              Visit Szukaj w Archiwach ↗
            </a>
          </div>

          <div className={styles.archiveStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>55M+</span>
              <span className={styles.statLabel}>Document scans</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>36,213</span>
              <span className={styles.statLabel}>Parishes indexed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>1400s–</span>
              <span className={styles.statLabel}>Records dating from</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
