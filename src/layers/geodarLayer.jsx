import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { GEODAR_PMTILES_URL, GEODAR_SOURCE_LAYER } from '../config/mapConfig'

const GEODAR_TEXT_SIZE = [
  'interpolate',
  ['linear'],
  ['zoom'],
  0,
  ['+', ['get', 'order'], 5],
  1,
  ['+', ['get', 'order'], 6],
  2,
  ['+', ['get', 'order'], 7],
  3,
  ['+', ['get', 'order'], 8],
  4,
  ['+', ['get', 'order'], 9],
  5,
  ['+', ['get', 'order'], 10],
  6,
  ['+', ['get', 'order'], 11],
  7,
  ['+', ['get', 'order'], 12],
  8,
  ['+', ['get', 'order'], 13],
  9,
  ['+', ['get', 'order'], 14],
  10,
  ['+', ['get', 'order'], 15],
  11,
  ['+', ['get', 'order'], 16],
  12,
  ['+', ['get', 'order'], 17],
]

function formatNumber(value, digits) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : 'Unknown'
}

function buildHoveredGeodar(event, feature) {
  const properties = feature?.properties ?? {}

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    id: properties.id_v11 ?? 'Unknown',
    reservoirVolume: formatNumber(properties.rv_mcm_v11, 0),
  }
}

const geodarLayer = {
  id: 'geodar',
  stateKey: 'hoveredGeodar',
  isVisible: ({ appState }) => appState.layers.geodar,
  getInteractiveLayerIds() {
    return ['geodar-hit-layer']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'geodar-hit-layer')

    return {
      hoveredGeodar: hoveredFeature ? buildHoveredGeodar(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredGeodar: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="geodar-source" type="vector" url={`pmtiles://${GEODAR_PMTILES_URL}`}>
        <Layer
          id="geodar-layer"
          type="symbol"
          source-layer={GEODAR_SOURCE_LAYER}
          layout={{
            'text-field': 'Δ',
            'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': GEODAR_TEXT_SIZE,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': '#000000',
            'text-opacity': 0.95,
          }}
        />
        <Layer
          id="geodar-highlight-layer"
          type="symbol"
          source-layer={GEODAR_SOURCE_LAYER}
          filter={['==', ['get', 'id_v11'], interactionState.hoveredGeodar?.id ?? '__none__']}
          layout={{
            'text-field': 'Δ',
            'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': GEODAR_TEXT_SIZE,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': '#c62828',
            'text-opacity': 1,
          }}
        />
        <Layer
          id="geodar-hit-layer"
          type="circle"
          source-layer={GEODAR_SOURCE_LAYER}
          paint={{
            'circle-radius': 14,
            'circle-color': '#000000',
            'circle-opacity': 0,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredGeodar = interactionState.hoveredGeodar

    if (!hoveredGeodar) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredGeodar.latitude}
        longitude={hoveredGeodar.longitude}
        offset={10}
      >
        <div className="river-popup">
          <strong>GeoDAR ID: {hoveredGeodar.id}</strong>
          <p>Reservoir Volume: {hoveredGeodar.reservoirVolume}</p>
        </div>
      </Popup>
    )
  },
}

export default geodarLayer
