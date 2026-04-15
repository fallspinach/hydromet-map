import { Layer, Popup, Source } from 'react-map-gl/maplibre'

const STATIONS_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/fcst_points.geojson'

function buildHoveredStation(event, feature) {
  const properties = feature?.properties ?? {}
  const location = properties.Location || 'Unknown'
  const locationParts = location.split(' - ')

  return {
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
    id: properties.ID ?? 'Unknown',
    river: properties.River || 'Unknown',
    location: locationParts.length > 1 ? locationParts.slice(1).join(' - ') : location,
    reachId: properties.ReachID ?? 'Unknown',
  }
}

function buildSelectedStation(feature) {
  return {
    id: feature.properties.ID,
    name: feature.properties.Location,
    river: feature.properties.River,
    reachId: feature.properties.ReachID,
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
  }
}

const stationsLayer = {
  id: 'stations',
  stateKey: 'hoveredStation',
  isVisible: ({ appState }) => appState.layers.stations,
  getInteractiveLayerIds() {
    return ['stations-hit-layer']
  },
  getPointerState({ event }) {
    const hoveredFeature = event.features?.find((feature) => feature.layer.id === 'stations-hit-layer')
    return {
      hoveredStation: hoveredFeature ? buildHoveredStation(event, hoveredFeature) : null,
    }
  },
  getPointerLeaveState() {
    return { hoveredStation: null }
  },
  handleClick({ event, setSelectedStation }) {
    const clickedFeature = event.features?.find((feature) => feature.layer.id === 'stations-hit-layer')

    if (!clickedFeature || clickedFeature.geometry.type !== 'Point') {
      setSelectedStation(null)
      return true
    }

    setSelectedStation(buildSelectedStation(clickedFeature))
    return true
  },
  renderLayers({ interactionState }) {
    return (
      <>
        <Source id="stations-source" type="geojson" data={STATIONS_GEOJSON_URL}>
          <Layer
            id="stations-layer"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 5, 3, 6, 4, 12, 8],
              'circle-color': '#2563eb',
              'circle-stroke-width': 0,
            }}
          />
          <Layer
            id="stations-highlight-layer"
            type="circle"
            filter={['==', ['get', 'ID'], interactionState.hoveredStation?.id ?? '__none__']}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 5, 4, 6, 5, 12, 9],
              'circle-color': '#c62828',
              'circle-stroke-width': 0,
            }}
          />
        </Source>

        <Source id="stations-hit-source" type="geojson" data={STATIONS_GEOJSON_URL}>
          <Layer
            id="stations-hit-layer"
            type="circle"
            paint={{
              'circle-radius': 14,
              'circle-color': '#000000',
              'circle-opacity': 0,
            }}
          />
        </Source>
      </>
    )
  },
  renderPopups({ interactionState, selectedStation, setSelectedStation }) {
    return (
      <>
        {selectedStation ? (
          <Popup
            anchor="top"
            closeButton
            closeOnClick={false}
            latitude={selectedStation.latitude}
            longitude={selectedStation.longitude}
            maxWidth="280px"
            onClose={() => setSelectedStation(null)}
          >
            <div className="station-popup">
              <strong>{selectedStation.name}</strong>
              <p>{selectedStation.id}</p>
              <span>{selectedStation.river}</span>
              <p>Reach ID: {selectedStation.reachId}</p>
            </div>
          </Popup>
        ) : null}

        {interactionState.hoveredStation ? (
          <Popup
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            latitude={interactionState.hoveredStation.latitude}
            longitude={interactionState.hoveredStation.longitude}
            offset={10}
          >
            <div className="river-popup">
              <strong>ID: {interactionState.hoveredStation.id}</strong>
              <p>River: {interactionState.hoveredStation.river}</p>
              <p>Location: {interactionState.hoveredStation.location}</p>
              <p>Matching NWM Reach: {interactionState.hoveredStation.reachId}</p>
            </div>
          </Popup>
        ) : null}
      </>
    )
  },
}

export default stationsLayer
