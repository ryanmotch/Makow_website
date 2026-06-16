import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Register() {
  const { apiFetch, login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setErr('')
    if (form.password !== form.confirm) return setErr('Passwords do not match')
    setLoading(true)
    try {
      const res = await apiFetch('POST', '/register', { name: form.name, email: form.email, password: form.password })
      login(res.token, res.user)
      nav('/account')
    } catch (ex) { setErr(ex.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.sub}>Register to receive updates and access research</p>
        <div className="divider divider-center" />

        {err && <div className="alert alert-error">{err}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={set('name')} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="Choose a password" />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="Repeat password" />
          </div>
          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already registered? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
