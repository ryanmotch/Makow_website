import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ARCHIVES } from '../data/polishArchives'
import { VOIVODESHIP_BOUNDARIES } from '../data/voivodeshipBoundaries'
import styles from './PolishMap.module.css'

const ARCGIS_VERSION = '4.31'
const POLAND_CENTER = [19.4, 52.05]
const POLAND_ZOOM = 6
const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

async function loadArcgisModule(path) {
  const mod = await import(/* @vite-ignore */ `https://js.arcgis.com/${ARCGIS_VERSION}/@arcgis/core/${path}.js`)
  return mod.default
}

async function loadArcgisNamed(path) {
  return import(/* @vite-ignore */ `https://js.arcgis.com/${ARCGIS_VERSION}/@arcgis/core/${path}.js`)
}

export default function PolishMap() {
  const mapDivRef = useRef(null)
  const viewRef = useRef(null)
  const markerLayerRef = useRef(null)
  const modernLabelsHiddenRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [place, setPlace] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupBusy, setLookupBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [EsriMap, MapView, GraphicsLayer, Graphic, PopupTemplate, reactiveUtils, VectorTileLayer] = await Promise.all([
        loadArcgisModule('Map'),
        loadArcgisModule('views/MapView'),
        loadArcgisModule('layers/GraphicsLayer'),
        loadArcgisModule('Graphic'),
        loadArcgisModule('PopupTemplate'),
        loadArcgisNamed('core/reactiveUtils'),
        loadArcgisModule('layers/VectorTileLayer'),
      ])
      if (cancelled) return

      const boundariesLayer = new GraphicsLayer()
      const labelsLayer = new GraphicsLayer()
      const boundaryGraphics = []
      const labelGraphics = []
      for (const region of VOIVODESHIP_BOUNDARIES) {
        boundaryGraphics.push(
          new Graphic({
            geometry: { type: 'polygon', rings: region.rings },
            symbol: {
              type: 'simple-fill',
              color: [30, 80, 180, 0.06],
              outline: { color: [30, 80, 180, 0.7], width: 1 },
            },
          })
        )
        labelGraphics.push(
          new Graphic({
            geometry: { type: 'point', longitude: region.label[0], latitude: region.label[1] },
            symbol: {
              type: 'text',
              text: region.voivodeship,
              color: [60, 60, 60],
              haloColor: [255, 255, 255],
              haloSize: 1.2,
              font: { size: 9 },
            },
          })
        )
      }
      boundariesLayer.addMany(boundaryGraphics)
      labelsLayer.addMany(labelGraphics)

      const archivesLayer = new GraphicsLayer()
      const archivePopupTemplate = new PopupTemplate({
        title: '{office}',
        content:
          '<p>Holds records for the former {voivodeship} voivodeship (pre-1998).</p>' +
          '<p>Contact: <a href="mailto:{email}">{email}</a></p>',
        actions: [
          { type: 'button', id: 'search-archives', title: 'Search Archives', icon: 'search' },
        ],
      })
      archivesLayer.addMany(
        ARCHIVES.map(
          ({ voivodeship, office, email, lat, lon }) =>
            new Graphic({
              geometry: { type: 'point', longitude: lon, latitude: lat },
              attributes: { voivodeship, office, email },
              popupTemplate: archivePopupTemplate,
              symbol: {
                type: 'simple-marker',
                style: 'triangle',
                color: [30, 80, 180],
                size: 12,
                outline: { color: [255, 255, 255], width: 1.5 },
              },
            })
        )
      )

      const markerLayer = new GraphicsLayer()
      const basemapLayer = new VectorTileLayer({ style: BASEMAP_STYLE_URL })
      const map = new EsriMap({
        basemap: { baseLayers: [basemapLayer] },
        layers: [boundariesLayer, labelsLayer, archivesLayer, markerLayer],
      })
      const view = new MapView({
        container: mapDivRef.current,
        map,
        center: POLAND_CENTER,
        zoom: POLAND_ZOOM,
        // The default auto popup hit-test scans every layer (incl. the vector
        // basemap) on click, which throws after the basemap's style is mutated
        // at runtime below - open popups manually instead, only for pin hits.
        popup: { autoOpenEnabled: false },
      })

      view.when(() => {
        if (cancelled) return
        setMapReady(true)
        reactiveUtils.on(
          () => view.popup,
          'trigger-action',
          (event) => {
            if (event.action.id !== 'search-archives') return
            const voivodeship = view.popup.selectedFeature?.attributes?.voivodeship
            if (voivodeship) {
              navigate(`/polish-archives?voivodeship=${encodeURIComponent(voivodeship)}`)
            }
          }
        )
      })

      view.on('click', async (event) => {
        // Hide only the modern voivodeship (state-level) labels from the vector
        // basemap's style, leaving roads, water, city/town labels, etc. untouched.
        // Only do this once - repeated setStyleLayer calls churn the layer's
        // internal tile index and throw on the next hitTest.
        if (!modernLabelsHiddenRef.current) {
          modernLabelsHiddenRef.current = true
          const stateLabelLayer = basemapLayer.getStyleLayer('label_state')
          if (stateLabelLayer) {
            stateLabelLayer.layout = { ...stateLabelLayer.layout, visibility: 'none' }
            basemapLayer.setStyleLayer(stateLabelLayer)
          }
        }

        const hit = await view.hitTest(event, { include: archivesLayer })
        if (hit.results.length > 0) {
          view.openPopup({ features: [hit.results[0].graphic], location: event.mapPoint })
          return
        }

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
            Zoom and pan to browse Poland's cities, towns, and villages. The
            outlined regions are the pre-1998 voivodeships (the old
            49-province system used on most vital records — boundaries are
            an approximate overlay, not survey-accurate); the first click
            also hides today's voivodeship names so they don't compete with
            these labels. Blue markers sit on the old capitals and link to
            the State Archive now holding that region's records — click one
            for its contact email, or click elsewhere to identify the
            nearest place and jump to the vital records search.
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
                Click a blue marker for a pre-1998 voivodeship's State
                Archive contact, or click anywhere else to identify a city or
                village and jump to the archives search.
              </p>
            )}
            <p className={styles.attribution}>
              Map style:{' '}
              <a href="https://openfreemap.org" target="_blank" rel="noreferrer">
                OpenFreeMap
              </a>
              . Map data: OpenStreetMap contributors. Place lookup:{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>{' '}
              Nominatim. Archive contacts:{' '}
              <a href="https://www.szukajwarchiwach.gov.pl/en/wszystkie-archiwa" target="_blank" rel="noreferrer">
                szukajwarchiwach.gov.pl
              </a>
              . Only voivodeships with a confirmed matching archive are
              pinned — always confirm an address before relying on it.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
