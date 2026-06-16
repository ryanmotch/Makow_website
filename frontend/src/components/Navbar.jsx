import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MakowLogo from './MakowLogo'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const link = (to, label) => (
    <Link to={to} className={`${styles.link} ${pathname === to ? styles.active : ''}`}>
      {label}
    </Link>
  )

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <MakowLogo size={40} />
          <span className={styles.brandName}>GENEALOGY</span>
        </Link>

        <div className={styles.links}>
          {link('/', 'Home')}
          {link('/about', 'About')}
          {link('/contact', 'Contact')}
          {user && link('/account', 'My Account')}
          {user?.is_admin && link('/admin', 'Admin')}
          {!user && link('/login', 'Login')}
          {!user && link('/register', 'Register')}
        </div>

        {user && (
          <div className={styles.userArea}>
            <span className={styles.userName}>{user.name}</span>
            {user.is_paid && <span className={styles.paidBadge}>Paid</span>}
            <button onClick={logout} className={styles.logoutBtn}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  )
}
