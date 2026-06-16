import styles from './About.module.css'

const CREDENTIALS = [
  { icon: '🎓', text: 'BA. Political Science, Adelphi University' },
  { icon: '🏛️', text: 'Member: Association of Professional Genealogists' },
  { icon: '🔬', text: 'Trained DNA Analyst — Ancestry & 23andMe platforms' },
]

export default function About() {
  return (
    <div>
      <div className={styles.heroBanner}>
        <div className="container">
          <p className={styles.eyebrow}>Est. 2026</p>
          <h1 className={styles.heroTitle}>About Makow Genealogy</h1>
          <p className={styles.heroSub}>Two decades of uncovering family histories with rigour and care</p>
        </div>
      </div>

      <div className="container page">
        <div className={styles.layout}>
          <aside className={styles.portrait}>
            <img
              src="/portrait.jpg"
              alt="Henry Makow"
              className={styles.portraitImg}
            />
            <div className={styles.portraitMeta}>
              <strong>Ryan Motchkavitz, BA.</strong>
              <span>Certified Genealogist</span>
            </div>
          </aside>

          <div className={styles.body}>
            <h2 className={styles.bodyTitle}>A Lifelong Passion for Family History</h2>
            <div className="divider" />
            <p>For over twenty years, Makow Genealogy has helped families across North America trace their roots, discover their heritage, and connect with relatives they never knew existed.</p>
            <p>Founded by Mr. Ryan Motchkavitz, the practice combines rigorous academic methodology with the latest genealogical technology — from traditional archival research to cutting-edge DNA analysis.</p>
            <p>We specialize in Eastern European, Jewish, and North American lineages, with deep expertise in immigration records, and pre-war European documentation.</p>
            <p>Every family has a story. We make it our mission to tell yours with accuracy, sensitivity, and depth.</p>

            <h3 className={styles.credTitle}>Credentials</h3>
            <div className={styles.credentials}>
              {CREDENTIALS.map(({ icon, text }) => (
                <div key={text} className={styles.credItem}>
                  <span className={styles.credIcon}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          {[['20+','Years Experience'],['15','Countries Researched'],['98%','Client Satisfaction']].map(([n, l]) => (
            <div key={l} className={styles.statCard}>
              <span className={styles.statNum}>{n}</span>
              <span className={styles.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
