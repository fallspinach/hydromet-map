import { Layer, Popup, Source } from 'react-map-gl/maplibre'
import { UCRB_RIVER_NETWORK_PMTILES_URL, RIVER_NETWORK_SOURCE_LAYER } from '../config/mapConfig'

const RIVERS_LINE_WIDTH = [
  'interpolate',
  ['linear'],
  ['zoom'],
  0,
  ['-', ['get', 'stream_order'], 6],
  1,
  ['-', ['get', 'stream_order'], 6],
  2,
  ['-', ['get', 'stream_order'], 6],
  3,
  ['-', ['get', 'stream_order'], 5.5],
  4,
  ['-', ['get', 'stream_order'], 5],
  5,
  ['-', ['get', 'stream_order'], 5],
  6,
  ['-', ['get', 'stream_order'], 4],
  7,
  ['-', ['get', 'stream_order'], 3],
  8,
  ['-', ['get', 'stream_order'], 2],
  9,
  ['-', ['get', 'stream_order'], 1],
  10,
  ['-', ['get', 'stream_order'], 1],
  11,
  ['-', ['get', 'stream_order'], 1],
  12,
  ['+', ['get', 'stream_order'], 0],
  13,
  ['+', ['get', 'stream_order'], 1],
]

function buildHoveredUcrbRiver(event, feature) {
  const properties = feature?.properties ?? {}
  const rawLength = Number.parseFloat(properties.Shape_Length)
  const hasValidLength = Number.isFinite(rawLength)

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    featureId: properties.feature_id ?? 'Unknown',
    name: properties.gnis_name || 'Unnamed',
    source: properties.source || 'Unknown',
    lengthKm: hasValidLength ? (rawLength * 111.1).toFixed(1) : null,
    streamOrder: properties.stream_order ?? 'Unknown',
  }
}

const ucrbRiversLayer = {
  id: 'ucrbRivers',
  stateKey: 'hoveredUcrbRiver',
  isVisible: ({ appState }) => appState.layers.ucrbRivers,
  getInteractiveLayerIds() {
    return ['ucrb-rivers-line']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'ucrb-rivers-line')
    return {
      hoveredUcrbRiver: hoveredFeature ? buildHoveredUcrbRiver(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredUcrbRiver: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="ucrb-rivers-source" type="vector" url={`pmtiles://${UCRB_RIVER_NETWORK_PMTILES_URL}`}>
        <Layer
          id="ucrb-rivers-line"
          type="line"
          source-layer={RIVER_NETWORK_SOURCE_LAYER}
          paint={{
            'line-color': '#3cb371',
            'line-opacity': 0.9,
            'line-width': RIVERS_LINE_WIDTH,
          }}
        />
        <Layer
          id="ucrb-rivers-line-highlight"
          type="line"
          source-layer={RIVER_NETWORK_SOURCE_LAYER}
          filter={['==', ['get', 'feature_id'], interactionState.hoveredUcrbRiver?.featureId ?? '__none__']}
          paint={{
            'line-color': '#c62828',
            'line-opacity': 0.95,
            'line-width': RIVERS_LINE_WIDTH,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredRiver = interactionState.hoveredUcrbRiver

    if (!hoveredRiver) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredRiver.latitude}
        longitude={hoveredRiver.longitude}
        offset={10}
      >
        <div className="river-popup">
          <strong>River ID: {hoveredRiver.featureId}</strong>
          <p>Name: {hoveredRiver.name}</p>
          <p>Source: {hoveredRiver.source}</p>
          <p>
            Length: {hoveredRiver.lengthKm ?? 'Unknown'}{hoveredRiver.lengthKm ? ' km' : ''}
          </p>
          <p>Stream Order: {hoveredRiver.streamOrder}</p>
        </div>
      </Popup>
    )
  },
}

export default ucrbRiversLayer
