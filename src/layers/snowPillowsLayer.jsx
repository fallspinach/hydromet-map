import createSnowStationLayer from './snowStationLayerFactory'

const SNOW_PILLOWS_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/snowpillow.geojson'

const snowPillowsLayer = createSnowStationLayer({
  id: 'snowPillows',
  sourceId: 'snow-pillows-source',
  layerId: 'snow-pillows-layer',
  highlightLayerId: 'snow-pillows-highlight-layer',
  hitSourceId: 'snow-pillows-hit-source',
  hitLayerId: 'snow-pillows-hit-layer',
  data: SNOW_PILLOWS_GEOJSON_URL,
  circleColor: '#ff8c00',
  stateKey: 'hoveredSnowPillowStation',
})

export default snowPillowsLayer
