import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { HYDRO_RIVERS_PMTILES_URL, HYDRO_RIVERS_SOURCE_LAYER } from '../config/mapConfig'

const HYDRO_RIVERS_LINE_WIDTH = [
  'interpolate',
  ['linear'],
  ['zoom'],
  0,
  ['-', ['get', 'ORD_STRA'], 6],
  1,
  ['-', ['get', 'ORD_STRA'], 6],
  2,
  ['-', ['get', 'ORD_STRA'], 6],
  3,
  ['-', ['get', 'ORD_STRA'], 5.5],
  4,
  ['-', ['get', 'ORD_STRA'], 5],
  5,
  ['-', ['get', 'ORD_STRA'], 5],
  6,
  ['-', ['get', 'ORD_STRA'], 4],
  7,
  ['-', ['get', 'ORD_STRA'], 3],
  8,
  ['-', ['get', 'ORD_STRA'], 2],
  9,
  ['-', ['get', 'ORD_STRA'], 1],
  10,
  ['-', ['get', 'ORD_STRA'], 1],
  11,
  ['+', ['get', 'ORD_STRA'], 0],
  12,
  ['+', ['get', 'ORD_STRA'], 1],
]

function formatNumber(value, digits) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : 'Unknown'
}

function buildHoveredHydroRivers(event, feature) {
  const properties = feature?.properties ?? {}

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    hyrivId: properties.HYRIV_ID ?? 'Unknown',
    lengthKm: formatNumber(properties.LENGTH_KM, 1),
    uplandAreaKm2: formatNumber(properties.UPLAND_SKM, 1),
    strahlerOrder: properties.ORD_STRA ?? 'Unknown',
    upstreamDistanceKm: formatNumber(properties.DIST_UP_KM, 1),
    downstreamDistanceKm: formatNumber(properties.DIST_DN_KM, 1),
    nextDown: properties.NEXT_DOWN ?? 'Unknown',
  }
}

const hydroRiversLayer = {
  id: 'hydroRivers',
  stateKey: 'hoveredHydroRivers',
  isVisible: ({ appState }) => appState.layers.hydroRivers,
  getInteractiveLayerIds() {
    return ['hydro-rivers-line']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'hydro-rivers-line')

    return {
      hoveredHydroRivers: hoveredFeature ? buildHoveredHydroRivers(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredHydroRivers: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="hydro-rivers-source" type="vector" url={`pmtiles://${HYDRO_RIVERS_PMTILES_URL}`}>
        <Layer
          id="hydro-rivers-line"
          type="line"
          source-layer={HYDRO_RIVERS_SOURCE_LAYER}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': 'blueviolet',
            'line-opacity': 0.9,
            'line-width': HYDRO_RIVERS_LINE_WIDTH,
          }}
        />
        <Layer
          id="hydro-rivers-line-highlight"
          type="line"
          source-layer={HYDRO_RIVERS_SOURCE_LAYER}
          filter={['==', ['get', 'HYRIV_ID'], interactionState.hoveredHydroRivers?.hyrivId ?? '__none__']}
          layout={{
            'line-cap': 'round',
            'line-join': 'round',
          }}
          paint={{
            'line-color': '#c62828',
            'line-opacity': 0.95,
            'line-width': HYDRO_RIVERS_LINE_WIDTH,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredHydroRivers = interactionState.hoveredHydroRivers

    if (!hoveredHydroRivers) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredHydroRivers.latitude}
        longitude={hoveredHydroRivers.longitude}
        offset={10}
      >
        <div className="river-popup">
          <strong>HYRIV_ID: {hoveredHydroRivers.hyrivId}</strong>
          <p>Length: {hoveredHydroRivers.lengthKm} km</p>
          <p>
            Upland Area: {hoveredHydroRivers.uplandAreaKm2} km<sup>2</sup>
          </p>
          <p>Strahler Order: {hoveredHydroRivers.strahlerOrder}</p>
          <p>Upstream Distance: {hoveredHydroRivers.upstreamDistanceKm} km</p>
          <p>Downstream Distance: {hoveredHydroRivers.downstreamDistanceKm} km</p>
          <p>Downstream HYRIV_ID: {hoveredHydroRivers.nextDown}</p>
        </div>
      </Popup>
    )
  },
}

export default hydroRiversLayer
