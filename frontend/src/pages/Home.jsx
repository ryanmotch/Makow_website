import { Link } from 'react-router-dom'
import MakowLogo from '../components/MakowLogo'
import styles from './Home.module.css'

const SERVICES = [
  { icon: '🌳', title: 'Family Tree Construction', desc: 'Build a complete visual family tree spanning multiple generations with documented sources and verified records.', tier: 'Free Consult' },
  { icon: '📜', title: 'Historical Records Research', desc: 'Deep archival research through census records, birth/death certificates, immigration documents, and land deeds.', tier: 'Premium' },
  { icon: '🧬', title: 'DNA Analysis & Interpretation', desc: 'Interpret AncestryDNA, 23andMe, or MyHeritage results to identify relatives and confirm ancestral lineages.', tier: 'Premium' },
  { icon: '🌍', title: 'Immigration & Ship Records', desc: "Trace your ancestors' journey from their homeland through port records, naturalization papers, and ship manifests.", tier: 'Premium' },
  { icon: '⚔️', title: 'Military Records Research', desc: 'Uncover service records, pension files, and draft registrations from conflicts spanning more than two centuries.', tier: 'Premium' },
  { icon: '☠️', title: 'Cemetery Visits', desc: 'Grave visits, photos, maintenance, planting and cleaning', tier: 'Free Consult' },
]

const STATS = [
  
  { n: '20+', l: 'Years Experience' },
  { n: '15', l: 'Countries Researched' },
  { n: '98%', l: 'Client Satisfaction' },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <MakowLogo size={80} />
          <h1 className={styles.heroTitle}>
            Uncovering Your<br />
            <em>Family's Story</em>
          </h1>
          <p className={styles.heroSub}>
            Meticulous genealogical research, historical records analysis, and DNA interpretation — trusted by families across North America for over 20 years.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/contact" className="btn btn-primary">Begin Your Search</Link>
            <Link to="/about" className="btn btn-outline">Our Approach</Link>
          </div>
        </div>
        <div className={styles.heroPattern} aria-hidden />
      </section>

      {/* Stats */}
      <section className={styles.statsBar}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map(({ n, l }) => (
              <div key={l} className={styles.stat}>
                <span className={styles.statNum}>{n}</span>
                <span className={styles.statLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container page">
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>What We Offer</p>
          <h2 className={styles.sectionTitle}>Genealogy Services</h2>
          <div className="divider" />
          <p className={styles.sectionSub}>Comprehensive research tailored to your family's unique history and heritage.</p>
        </div>

        <div className={styles.servicesGrid}>
          {SERVICES.map(({ icon, title, desc, tier }) => (
            <div key={title} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>{icon}</div>
              <h3 className={styles.serviceTitle}>{title}</h3>
              <p className={styles.serviceDesc}>{desc}</p>
              <span className={`${styles.tier} ${tier === 'Free Consult' ? styles.tierFree : ''}`}>
                {tier}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Discover Your Roots?</h2>
            <p className={styles.ctaSub}>Every family has a story waiting to be told. Let us help you find yours.</p>
          </div>
          <Link to="/contact" className="btn btn-primary">Get a Free Consultation</Link>
        </div>
      </section>
    </div>
  )
}
