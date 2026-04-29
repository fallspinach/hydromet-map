import { Layer, Popup, Source } from 'react-map-gl/maplibre'

const OCWD_BOUNDARY_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/ocwd/csv/OCWD_OwnershipBoundary.geojson'

function formatAcres(value) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : 'Unknown'
}

function buildHoveredOcwdBoundary(event, feature) {
  const properties = feature?.properties ?? {}

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    objectId: properties.OBJECTID ?? 'Unknown',
    ownerName: properties.OWNERNAME ?? 'Unknown',
    acres: formatAcres(properties.ACRES),
  }
}

const ocwdBoundaryLayer = {
  id: 'ocwdBoundary',
  stateKey: 'hoveredOcwdBoundary',
  isVisible: ({ appState }) => appState.layers.ocwdBoundary,
  getInteractiveLayerIds() {
    return ['ocwd-boundary-outline']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'ocwd-boundary-outline')

    return {
      hoveredOcwdBoundary: hoveredFeature ? buildHoveredOcwdBoundary(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredOcwdBoundary: null }
  },
  renderLayers({ interactionState }) {
    return (
      <Source id="ocwd-boundary-source" type="geojson" data={OCWD_BOUNDARY_GEOJSON_URL}>
        <Layer
          id="ocwd-boundary-outline"
          type="line"
          paint={{
            'line-color': '#000000',
            'line-width': 2,
            'line-opacity': 0.95,
          }}
        />
        <Layer
          id="ocwd-boundary-highlight"
          type="line"
          filter={['==', ['get', 'OBJECTID'], interactionState.hoveredOcwdBoundary?.objectId ?? '__none__']}
          paint={{
            'line-color': '#c62828',
            'line-width': 3,
            'line-opacity': 1,
          }}
        />
      </Source>
    )
  },
  renderPopups({ interactionState }) {
    const hoveredOcwdBoundary = interactionState.hoveredOcwdBoundary

    if (!hoveredOcwdBoundary) {
      return null
    }

    return (
      <Popup
        anchor="bottom"
        closeButton={false}
        closeOnClick={false}
        latitude={hoveredOcwdBoundary.latitude}
        longitude={hoveredOcwdBoundary.longitude}
        offset={10}
      >
        <div className="river-popup">
          <p>Name: {hoveredOcwdBoundary.ownerName}</p>
          <p>Area: {hoveredOcwdBoundary.acres} acres</p>
        </div>
      </Popup>
    )
  },
}

export default ocwdBoundaryLayer
