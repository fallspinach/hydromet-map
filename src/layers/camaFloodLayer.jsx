import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { CAMA_FLOOD_PMTILES_URL, CAMA_FLOOD_SOURCE_LAYER } from '../config/mapConfig'

const CAMA_FLOOD_LINE_WIDTH = [
  'interpolate',
  ['linear'],
  ['zoom'],
  0,
  ['*', ['-', ['get', 'log_uparea'], 11], 1.5],
  1,
  ['*', ['-', ['get', 'log_uparea'], 11], 1.5],
  2,
  ['*', ['-', ['get', 'log_uparea'], 11], 1.5],
  3,
  ['*', ['-', ['get', 'log_uparea'], 10.5], 1.5],
  4,
  ['*', ['-', ['get', 'log_uparea'], 10], 1.5],
  5,
  ['*', ['-', ['get', 'log_uparea'], 10], 1.5],
  6,
  ['*', ['-', ['get', 'log_uparea'], 9], 1.5],
  7,
  ['*', ['-', ['get', 'log_uparea'], 8], 1.5],
  8,
  ['*', ['-', ['get', 'log_uparea'], 7], 1.5],
  9,
  ['*', ['-', ['get', 'log_uparea'], 6], 1.5],
  10,
  ['*', ['-', ['get', 'log_uparea'], 6], 1.5],
  11,
  ['*', ['-', ['get', 'log_uparea'], 6], 1.5],
  12,
  ['*', ['-', ['get', 'log_uparea'], 5], 1.5],
]

function formatNumber(value, digits) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : 'Unknown'
}

function buildHoveredCamaFlood(event, feature) {
  const properties = feature?.properties ?? {}

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    dindex: properties.dindex ?? 'Unknown',
    lengthKm: formatNumber(Number.parseFloat(properties.rivlen) / 1000, 1),
    className: properties.class ?? 'Unknown',
    widthM: formatNumber(properties.width, 1),
    elevationM: formatNumber(properties.elevtn, 1),
    upstreamAreaKm2: formatNumber(Number.parseFloat(properties.uparea) / 1000000, 1),
  }
}

const camaFloodLayer = {
  id: 'camaFlood',
  stateKey: 'hoveredCamaFlood',
  isVisible: ({ appState }) => appState.layers.camaFlood,
  getInteractiveLayerIds() {
    return ['cama-flood-line']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'cama-flood-line')

    return {
      hoveredCamaFlood: hoveredFeature ? buildHoveredCamaFlood(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredCamaFlood: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="cama-flood-source" type="vector" url={`pmtiles://${CAMA_FLOOD_PMTILES_URL}`}>
        <Layer
          id="cama-flood-line"
          type="line"
          source-layer={CAMA_FLOOD_SOURCE_LAYER}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': 'limegreen',
            'line-opacity': 0.9,
            'line-width': CAMA_FLOOD_LINE_WIDTH,
          }}
        />
        <Layer
          id="cama-flood-line-highlight"
          type="line"
          source-layer={CAMA_FLOOD_SOURCE_LAYER}
          filter={['==', ['get', 'dindex'], interactionState.hoveredCamaFlood?.dindex ?? '__none__']}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': '#c62828',
            'line-opacity': 0.95,
            'line-width': CAMA_FLOOD_LINE_WIDTH,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredCamaFlood = interactionState.hoveredCamaFlood

    if (!hoveredCamaFlood) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredCamaFlood.latitude}
        longitude={hoveredCamaFlood.longitude}
        offset={10}
      >
        <div className="river-popup">
          <strong>Grid Index: {hoveredCamaFlood.dindex}</strong>
          <p>Length: {hoveredCamaFlood.lengthKm} km</p>
          <p>Class: {hoveredCamaFlood.className}</p>
          <p>Width: {hoveredCamaFlood.widthM} m</p>
          <p>Elevation: {hoveredCamaFlood.elevationM} m</p>
          <p>
            Upstream Area: {hoveredCamaFlood.upstreamAreaKm2} km<sup>2</sup>
          </p>
        </div>
      </Popup>
    )
  },
}

export default camaFloodLayer
