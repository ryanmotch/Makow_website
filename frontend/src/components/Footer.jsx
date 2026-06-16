import { Link } from 'react-router-dom'
import MakowLogo from './MakowLogo'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <MakowLogo size={36} />
          <span>Makow Genealogy Services</span>
        </div>
        <div className={styles.links}>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <p className={styles.copy}>© {new Date().getFullYear()} Makow Genealogy. Uncovering family histories since 2006.</p>
      </div>
    </footer>
  )
}
