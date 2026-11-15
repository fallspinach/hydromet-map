import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { CDEC_SWE_CATALOG_URL, CDEC_SWE_LAYERS } from '../../config/publicationTimeSeries'
import { createPublishedStation, loadTimeSeriesCatalog, loadTimeSeriesCollection } from '../../lib/publicationTimeSeries'
import PublicationTimeSeriesPopup from './PublicationTimeSeriesPopup'

let catalogPromise
const collectionPromises = new Map()
function getPublication(definition) {
  if (!catalogPromise) catalogPromise = loadTimeSeriesCatalog(CDEC_SWE_CATALOG_URL)
    .catch(error => { catalogPromise = null; throw error })
  if (!collectionPromises.has(definition.collectionId)) {
    const promise = catalogPromise.then(({ catalog, url }) => {
      const layer = catalog.layers.find(item => item.id === definition.collectionId)
      if (!layer) throw new Error(`Collection is missing: ${definition.shortLabel}`)
      return loadTimeSeriesCollection(new URL(layer.href, url).href)
    }).then(publication => {
      if (publication.collection.id !== definition.collectionId
        || publication.collection.source?.measurementMethod !== definition.method) {
        throw new Error('Collection identity or measurement method does not match its layer.')
      }
      return publication
    }).catch(error => { collectionPromises.delete(definition.collectionId); throw error })
    collectionPromises.set(definition.collectionId, promise)
  }
  return collectionPromises.get(definition.collectionId)
}
function usePublication(definition) {
  const [result, setResult] = useState(null)
  useEffect(() => {
    let active = true
    getPublication(definition).then(publication => { if (active) setResult({ publication }) }, error => { if (active) setResult({ error: error.message }) })
    return () => { active = false }
  }, [definition])
  return result
}
export function PublishedStations({ definition, hoveredId }) {
  const result = usePublication(definition)
  const course = definition.method === 'snow_course'
  const { id } = definition
  if (!result || result.error) return <div className="publication-series-status" role="status" style={{ bottom: course ? 85 : 45 }}>
    {definition.shortLabel}: {result?.error ?? 'Loading stations…'}
  </div>
  return <Source id={`${id}-source`} type="geojson" data={result.publication.geometry}>
    <Layer id={`${id}-points`} type="circle" paint={{
      'circle-radius': course ? 4.5 : 3.5,
      'circle-color': definition.color, 'circle-opacity': course ? 0 : 1,
      'circle-stroke-color': course ? definition.color : '#fff', 'circle-stroke-width': course ? 1 : 0.5,
    }} />
    <Layer id={`${id}-highlight`} type="circle" filter={['==', ['get', 'station_id'], hoveredId ?? '__none__']}
      paint={{ 'circle-radius': course ? 6 : 5, 'circle-color': definition.color,
        'circle-opacity': course ? 0 : 1, 'circle-stroke-color': definition.color, 'circle-stroke-width': 1 }} />
    <Layer id={`${id}-hit`} type="circle" paint={{ 'circle-radius': 14, 'circle-opacity': 0 }} />
  </Source>
}
export function PublishedPopup({ definition, selectedStation, setSelectedStation, appState }) {
  const result = usePublication(definition)
  const [nearby, setNearby] = useState(null)
  const stationId = selectedStation?.id
  const longitude = selectedStation?.longitude
  const latitude = selectedStation?.latitude
  const owner = selectedStation?.popupOwnerId
  const visibleIds = CDEC_SWE_LAYERS.filter(layer => appState.layers[layer.id]).map(layer => layer.id).join(',')
  const identity = `${owner}|${stationId}|${longitude}|${latitude}|${visibleIds}`
  useEffect(() => {
    if (owner !== definition.id) return
    let active = true
    const visible = CDEC_SWE_LAYERS.filter(layer => visibleIds.split(',').includes(layer.id))
    Promise.allSettled(visible.map(async layer => {
      const publication = await getPublication(layer)
      return publication.geometry.features
        .filter(feature => feature.geometry?.type === 'Point'
          && Math.abs(feature.geometry.coordinates[0] - longitude) < 0.00001
          && Math.abs(feature.geometry.coordinates[1] - latitude) < 0.00001)
        .map(feature => createPublishedStation(feature, layer))
    })).then(results => {
      if (active) setNearby({ identity, choices: results.flatMap(result => result.status === 'fulfilled' ? result.value : []) })
    })
    return () => { active = false }
  }, [definition, identity, latitude, longitude, owner, visibleIds])
  const choices = [...(selectedStation?.choices ?? []), ...(nearby?.identity === identity ? nearby.choices : [])]
  const uniqueChoices = [...new Map(choices.filter(choice => appState.layers[choice.layerId])
    .map(choice => [`${choice.popupOwnerId}|${choice.id}`, choice])).values()]
  return result?.publication && owner === definition.id
    ? <PublicationTimeSeriesPopup key={`${definition.id}:${stationId}`}
        publication={result.publication} station={selectedStation} setSelectedStation={setSelectedStation}
        choices={uniqueChoices} /> : null
}
