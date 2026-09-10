import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MAP_VIEWBOX, VOIVODESHIP_PATHS, VOIVODESHIP_NAMES } from '../data/polishVoivodeships'
import styles from './PolishMap.module.css'

export default function PolishMap() {
  const [selectedId, setSelectedId] = useState(null)
  const navigate = useNavigate()

  const selectedName = selectedId ? VOIVODESHIP_NAMES[selectedId] : null

  const goToArchives = (id) => {
    const name = VOIVODESHIP_NAMES[id]
    navigate(`/polish-archives?voivodeship=${encodeURIComponent(name)}`)
  }

  return (
    <div className="container page">
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Voivodeship Map</h2>
          <p className={styles.sub}>
            Poland's 49 provinces as they existed from 1975–1998 — the administrative
            divisions used on most pre-war and communist-era vital records. Click a
            region to search the archives for that area.
          </p>
        </div>

        <div className={styles.mapArea}>
          <div className={styles.mapFrame}>
            <svg
              className={styles.svg}
              viewBox={MAP_VIEWBOX}
              role="img"
              aria-label="Map of Poland's 49 voivodeships, 1975–1998"
            >
              {VOIVODESHIP_PATHS.map(({ id, d }) => (
                <path
                  key={id}
                  d={d}
                  className={`${styles.region} ${selectedId === id ? styles.active : ''}`}
                  onMouseEnter={() => setSelectedId(id)}
                  onFocus={() => setSelectedId(id)}
                  onClick={() => goToArchives(id)}
                  tabIndex={0}
                  role="button"
                  aria-label={VOIVODESHIP_NAMES[id]}
                >
                  <title>{VOIVODESHIP_NAMES[id]}</title>
                </path>
              ))}
            </svg>
          </div>

          <aside className={styles.sidebar}>
            {selectedName ? (
              <>
                <div className={styles.sidebarName}>{selectedName}</div>
                <p className={styles.sidebarHint}>
                  Voivodeship (do 1998) — click the region to open the vital
                  records search pre-filled for this area.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => goToArchives(selectedId)}
                >
                  Search Archives →
                </button>
              </>
            ) : (
              <p className={styles.sidebarEmpty}>
                Hover or tap a region to see its name, then click to jump to the
                archives search.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
