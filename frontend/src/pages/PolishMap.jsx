import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './PolishMap.module.css'

const ARCGIS_VERSION = '4.31'
const POLAND_CENTER = [19.4, 52.05]
const POLAND_ZOOM = 6

async function loadArcgisModule(path) {
  const mod = await import(/* @vite-ignore */ `https://js.arcgis.com/${ARCGIS_VERSION}/@arcgis/core/${path}.js`)
  return mod.default
}

export default function PolishMap() {
  const mapDivRef = useRef(null)
  const viewRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [place, setPlace] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupBusy, setLookupBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [EsriMap, MapView, GraphicsLayer, Graphic] = await Promise.all([
        loadArcgisModule('Map'),
        loadArcgisModule('views/MapView'),
        loadArcgisModule('layers/GraphicsLayer'),
        loadArcgisModule('Graphic'),
      ])
      if (cancelled) return

      const markerLayer = new GraphicsLayer()
      const map = new EsriMap({ basemap: 'osm', layers: [markerLayer] })
      const view = new MapView({
        container: mapDivRef.current,
        map,
        center: POLAND_CENTER,
        zoom: POLAND_ZOOM,
      })

      view.when(() => {
        if (cancelled) return
        setMapReady(true)
      })

      view.on('click', async (event) => {
        const { latitude, longitude } = event.mapPoint
        markerLayer.removeAll()
        markerLayer.add(
          new Graphic({
            geometry: { type: 'point', longitude, latitude },
            symbol: {
              type: 'simple-marker',
              color: [200, 23, 26],
              size: 10,
              outline: { color: [255, 255, 255], width: 1.5 },
            },
          })
        )
        lookupPlace(latitude, longitude)
      })

      viewRef.current = view
      markerLayerRef.current = markerLayer
    }

    init()

    return () => {
      cancelled = true
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [])

  const lookupPlace = async (lat, lon) => {
    if (lookupBusy) return
    setLookupBusy(true)
    setLookupLoading(true)
    setPlace(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`
      )
      const data = await res.json()
      const addr = data.address || {}
      const name = addr.village || addr.town || addr.city || addr.municipality || addr.county || data.name
      setPlace({
        name: name || 'Unnamed location',
        region: [addr.state, addr.country].filter(Boolean).join(', '),
        lat,
        lon,
      })
    } catch {
      setPlace({ name: null, error: true, lat, lon })
    } finally {
      setLookupLoading(false)
      setTimeout(() => setLookupBusy(false), 1000)
    }
  }

  return (
    <div className="container page">
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Poland Map</h2>
          <p className={styles.sub}>
            Zoom and pan to browse Poland's cities, towns, and villages. Click any
            point on the map to identify the nearest place and jump to the vital
            records search for that location.
          </p>
        </div>

        <div className={styles.mapArea}>
          <div className={styles.mapFrame}>
            <div ref={mapDivRef} className={styles.mapDiv} />
            {!mapReady && <div className={styles.mapLoading}>Loading map…</div>}
          </div>

          <aside className={styles.sidebar}>
            {lookupLoading ? (
              <p className={styles.sidebarEmpty}>Looking up place…</p>
            ) : place ? (
              place.error ? (
                <p className={styles.sidebarEmpty}>Couldn't look up that location. Try clicking again.</p>
              ) : (
                <>
                  <div className={styles.sidebarName}>{place.name}</div>
                  {place.region && <div className={styles.sidebarMeta}>{place.region}</div>}
                  <p className={styles.sidebarHint}>
                    Use this place name to search Polish vital records for this area.
                  </p>
                  <Link
                    to={`/polish-archives?location=${encodeURIComponent(place.name)}`}
                    className="btn btn-primary btn-sm"
                  >
                    Search Archives →
                  </Link>
                </>
              )
            ) : (
              <p className={styles.sidebarEmpty}>
                Click a city or village on the map to see its name, then jump to
                the archives search.
              </p>
            )}
            <p className={styles.attribution}>
              Map: OpenStreetMap contributors via ArcGIS. Place lookup:{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>{' '}
              Nominatim.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
