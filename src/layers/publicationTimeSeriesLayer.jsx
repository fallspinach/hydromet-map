import { Popup } from 'react-map-gl/maplibre'
import { createPublishedStation } from '../lib/publicationTimeSeries'
import { PublishedStations, PublishedPopup } from '../features/publicationTimeSeries/PublishedStations'
import { CDEC_SWE_LAYERS } from '../config/publicationTimeSeries'
import { findBookmarkFeatureAtPoint } from './bookmarkRestore'

function nearestStation(event) {
  const hitIds = CDEC_SWE_LAYERS.map(layer => `${layer.id}-hit`)
  const features = (event.features ?? []).filter(feature => hitIds.includes(feature.layer.id)
    && feature.geometry.type === 'Point')
  return features.reduce((nearest, feature) => {
    const point = event.target.project(feature.geometry.coordinates)
    const distance = Math.hypot(point.x - event.point.x, point.y - event.point.y)
    return !nearest || distance < nearest.distance ? { feature, distance } : nearest
  }, null)?.feature
}

function choicesAtPoint(features) {
  const choices = new Map()
  for (const definition of CDEC_SWE_LAYERS) {
    for (const feature of features ?? []) {
      if (feature.layer.id === `${definition.id}-hit` && feature.geometry.type === 'Point') {
        const station = createPublishedStation(feature, definition)
        choices.set(`${station.popupOwnerId}|${station.id}`, station)
      }
    }
  }
  return [...choices.values()]
}
function selectStation(feature, definition, choices, bookmark = {}) {
  return {
    ...createPublishedStation(feature, definition), choices,
    popup: { activeTabId: bookmark.tabId ?? '', unitSystem: bookmark.unitSystem === 'customary' ? 'customary' : 'metric' },
  }
}
function createLayer(definition) {
  const { id } = definition
  const hitLayerId = `${id}-hit`
  const stateKey = `hovered${id}`
  return {
    id,
    stateKey,
    getPointerState({ event }) {
      const feature = nearestStation(event)
      const p = feature?.properties
      return { [stateKey]: feature?.layer.id === hitLayerId ? {
        longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1],
        id: p.station_id, name: p.name, basin: p.basin,
        hydroArea: p.hydro_area ?? p.hydroArea ?? p.HydroArea,
        elevation: p.elevation_raw, operator: p.operator,
      } : null }
    },
    getPointerLeaveState: () => ({ [stateKey]: null }),
    isVisible: ({ appState }) => appState.layers[id],
    getInteractiveLayerIds: () => [hitLayerId],
    handleClick({ event, setSelectedStation }) {
      const feature = nearestStation(event)
      if (feature?.layer.id !== hitLayerId) return false
      setSelectedStation(selectStation(feature, definition, choicesAtPoint(event.features)))
      return true
    },
    restorePopupFromBookmark({ bookmarkPopup, mapInstance, setSelectedStation }) {
      const feature = findBookmarkFeatureAtPoint({ bookmarkPopup, mapInstance, layerIds: [hitLayerId], getFeatureId: item => item.properties.station_id })
      if (feature?.geometry.type !== 'Point') return false
      const point = mapInstance.project([bookmarkPopup.longitude, bookmarkPopup.latitude])
      const layers = CDEC_SWE_LAYERS.map(layer => `${layer.id}-hit`).filter(layer => mapInstance.getLayer(layer))
      const nearby = mapInstance.queryRenderedFeatures([[point.x - 10, point.y - 10], [point.x + 10, point.y + 10]], { layers })
      setSelectedStation(selectStation(feature, definition, choicesAtPoint(nearby), bookmarkPopup))
      return true
    },
    renderLayers: ({ interactionState }) => <PublishedStations definition={definition} hoveredId={interactionState[stateKey]?.id} />,
    renderPopups: props => {
      const hovered = props.interactionState[stateKey]
      return <>
        <PublishedPopup {...props} definition={definition} />
        {hovered && !props.selectedStation && <Popup longitude={hovered.longitude} latitude={hovered.latitude}
          closeButton={false} closeOnClick={false} offset={10} maxWidth="280px">
          <div className="river-popup">
            <strong>Station ID: {hovered.id}</strong>
            <p>Station Name: {hovered.name}</p>
            <p>Observation: {definition.shortLabel}</p>
            {hovered.basin && <p>Basin Name: {hovered.basin}</p>}
            {hovered.hydroArea && <p>Hydro Area: {hovered.hydroArea}</p>}
            {hovered.elevation && <p>Elevation: {hovered.elevation}</p>}
            {hovered.operator && <p>Operator: {hovered.operator}</p>}
          </div>
        </Popup>}
      </>
    },
  }
}
export default CDEC_SWE_LAYERS.map(createLayer)
