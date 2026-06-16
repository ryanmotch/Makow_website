import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Contact.module.css'

const SERVICES = ['Family Tree Construction','Historical Records Research','DNA Analysis & Interpretation','Immigration & Ship Records','Military Records Research','Photo Restoration','General Consultation']
const ANCESTRIES = ['Eastern European','Western European','Jewish / Ashkenazi','Jewish / Sephardic','North American','Latin American','Asian','African','Middle Eastern','Mixed / Unsure']
const PERIODS = ['Pre-1800','1800–1900','1900–1950','1950–Present','Multiple Periods']
const REGIONS = ['Poland','Russia / Ukraine','Germany / Austria','Hungary / Romania','United Kingdom','France / Belgium','Italy','Canada','United States','Israel / Palestine','Multiple Regions','Other']
const BUDGETS = ['Under $500','$500–$1,500','$1,500–$5,000','$5,000+','To be discussed']

export default function Contact() {
  const { apiFetch } = useAuth()
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:'', email:'', phone:'', service:'', ancestry:'',
    time_period:'', geographic_region:'', budget:'', message:''
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await apiFetch('POST', '/contact', form)
      setSent(true)
    } catch(ex) { setErr(ex.message) }
    finally { setLoading(false) }
  }

  if (sent) return (
    <div className={styles.success}>
      <div className={styles.successIcon}>✅</div>
      <h2>Inquiry Received</h2>
      <div className="divider divider-center" />
      <p>Thank you for reaching out. We'll review your information and contact you within 2 business days to discuss how we can help uncover your family history.</p>
    </div>
  )

  return (
    <div className="container page">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Get in Touch</p>
        <h1 className={styles.title}>Start Your Research</h1>
        <div className="divider" />
        <p className={styles.sub}>Tell us about your genealogy project and we'll get back to you with a personalised research plan.</p>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className={styles.formWrap}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={set('name')} required placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label>Service Interested In</label>
              <select value={form.service} onChange={set('service')}>
                <option value="">— Select a service —</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ancestry / Heritage</label>
              <select value={form.ancestry} onChange={set('ancestry')}>
                <option value="">— Select origin —</option>
                {ANCESTRIES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Time Period of Interest</label>
              <select value={form.time_period} onChange={set('time_period')}>
                <option value="">— Select period —</option>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Geographic Region</label>
              <select value={form.geographic_region} onChange={set('geographic_region')}>
                <option value="">— Select region —</option>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Budget Range</label>
              <select value={form.budget} onChange={set('budget')}>
                <option value="">— Select budget —</option>
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Research Goals *</label>
            <textarea
              value={form.message} onChange={set('message')} required
              placeholder="Describe what you know, what you're hoping to find, and any specific ancestors or records you're looking for..."
              style={{ minHeight: 140 }}
            />
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Sending…' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </div>
  )
}
