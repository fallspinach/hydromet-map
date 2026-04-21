import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { GRIT_PMTILES_URL, GRIT_SOURCE_LAYER } from '../config/mapConfig'

const GRIT_LINE_WIDTH = [
  'interpolate',
  ['linear'],
  ['zoom'],
  0,
  ['-', ['get', 'olna'], 7],
  1,
  ['-', ['get', 'olna'], 7],
  2,
  ['-', ['get', 'olna'], 7],
  3,
  ['-', ['get', 'olna'], 6.5],
  4,
  ['-', ['get', 'olna'], 6],
  5,
  ['-', ['get', 'olna'], 6],
  6,
  ['-', ['get', 'olna'], 5],
  7,
  ['-', ['get', 'olna'], 4],
  8,
  ['-', ['get', 'olna'], 3],
  9,
  ['-', ['get', 'olna'], 2],
  10,
  ['-', ['get', 'olna'], 2],
  11,
  ['-', ['get', 'olna'], 1],
  12,
  ['+', ['get', 'olna'], 0],
]

function formatNumber(value, digits) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : 'Unknown'
}

function buildHoveredGrit(event, feature) {
  const properties = feature?.properties ?? {}
  const name = properties.name
  const localName = properties.name_local

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    globalId: properties.global_id ?? 'Unknown',
    lengthKm: formatNumber(Number.parseFloat(properties.length) / 1000, 1),
    drainageAreaOutKm2: formatNumber(properties.drainage_area_out, 1),
    strahlerOrder: properties.strahler_order ?? 'Unknown',
    upstreamLineIds: properties.upstream_line_ids ?? 'Unknown',
    downstreamLineIds: properties.downstream_line_ids ?? 'Unknown',
    isMainstem: properties.is_mainstem ?? 'Unknown',
    bifurcationBalanceOut: formatNumber(properties.bifurcation_balance_out, 3),
    name: typeof name === 'string' && name.trim() && name.toLowerCase() !== 'none' ? name : null,
    localName:
      typeof localName === 'string' && localName.trim() && localName.toLowerCase() !== 'none'
        ? localName
        : null,
  }
}

const gritLayer = {
  id: 'grit',
  stateKey: 'hoveredGrit',
  isVisible: ({ appState }) => appState.layers.grit,
  getInteractiveLayerIds() {
    return ['grit-line']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'grit-line')

    return {
      hoveredGrit: hoveredFeature ? buildHoveredGrit(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredGrit: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="grit-source" type="vector" url={`pmtiles://${GRIT_PMTILES_URL}`}>
        <Layer
          id="grit-line"
          type="line"
          source-layer={GRIT_SOURCE_LAYER}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': 'hotpink',
            'line-opacity': 0.9,
            'line-width': GRIT_LINE_WIDTH,
          }}
        />
        <Layer
          id="grit-line-highlight"
          type="line"
          source-layer={GRIT_SOURCE_LAYER}
          filter={['==', ['get', 'global_id'], interactionState.hoveredGrit?.globalId ?? '__none__']}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': '#c62828',
            'line-opacity': 0.95,
            'line-width': GRIT_LINE_WIDTH,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredGrit = interactionState.hoveredGrit

    if (!hoveredGrit) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredGrit.latitude}
        longitude={hoveredGrit.longitude}
        offset={10}
      >
        <div className="river-popup">
          <strong>Global ID: {hoveredGrit.globalId}</strong>
          <p>Length: {hoveredGrit.lengthKm} km</p>
          <p>
            Drainage Area Out: {hoveredGrit.drainageAreaOutKm2} km<sup>2</sup>
          </p>
          <p>Strahler Order: {hoveredGrit.strahlerOrder}</p>
          <p>Upstream Line IDs: {hoveredGrit.upstreamLineIds}</p>
          <p>Downstream Line IDs: {hoveredGrit.downstreamLineIds}</p>
          <p>Mainstem? (0/1): {hoveredGrit.isMainstem}</p>
          <p>Bifurcation Balance Ratio: {hoveredGrit.bifurcationBalanceOut}</p>
          {hoveredGrit.name ? <p>Name: {hoveredGrit.name}</p> : null}
          {hoveredGrit.localName ? <p>Local Name: {hoveredGrit.localName}</p> : null}
        </div>
      </Popup>
    )
  },
}

export default gritLayer
