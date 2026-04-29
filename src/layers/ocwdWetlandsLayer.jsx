import { Layer, Popup, Source } from 'react-map-gl/maplibre'

const OCWD_WETLANDS_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/ocwd/csv/OCWD_WetlandPonds.geojson'

function formatArea(value) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : 'Unknown'
}

function buildHoveredOcwdWetland(event, feature) {
  const properties = feature?.properties ?? {}

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    name: properties.NAME ?? 'Unknown',
    type: properties.TYPE ?? 'Unknown',
    area: formatArea(properties['SHAPE.AREA']),
  }
}

const ocwdWetlandsLayer = {
  id: 'ocwdWetlands',
  stateKey: 'hoveredOcwdWetland',
  isVisible: ({ appState }) => appState.layers.ocwdWetlands,
  getInteractiveLayerIds() {
    return ['ocwd-wetlands-fill']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'ocwd-wetlands-fill')

    return {
      hoveredOcwdWetland: hoveredFeature ? buildHoveredOcwdWetland(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredOcwdWetland: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="ocwd-wetlands-source" type="geojson" data={OCWD_WETLANDS_GEOJSON_URL}>
        <Layer
          id="ocwd-wetlands-fill"
          type="fill"
          paint={{
            'fill-color': '#90ee90',
            'fill-opacity': 0,
          }}
        />
        <Layer
          id="ocwd-wetlands-outline"
          type="line"
          paint={{
            'line-color': 'lightgreen',
            'line-width': 1.5,
            'line-opacity': 0.95,
          }}
        />
        <Layer
          id="ocwd-wetlands-highlight"
          type="line"
          filter={['==', ['get', 'NAME'], interactionState.hoveredOcwdWetland?.name ?? '__none__']}
          paint={{
            'line-color': '#c62828',
            'line-width': 2.5,
            'line-opacity': 1,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredOcwdWetland = interactionState.hoveredOcwdWetland

    if (!hoveredOcwdWetland) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredOcwdWetland.latitude}
        longitude={hoveredOcwdWetland.longitude}
        offset={10}
      >
        <div className="river-popup">
          <p>Name: {hoveredOcwdWetland.name}</p>
          <p>Type: {hoveredOcwdWetland.type}</p>
        </div>
      </Popup>
    )
  },
}

export default ocwdWetlandsLayer
