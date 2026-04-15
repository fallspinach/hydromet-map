import createSnowStationLayer from './snowStationLayerFactory'

const SNOW_COURSES_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/snowcourse.geojson'

const snowCoursesLayer = createSnowStationLayer({
  id: 'snowCourses',
  sourceId: 'snow-courses-source',
  layerId: 'snow-courses-layer',
  highlightLayerId: 'snow-courses-highlight-layer',
  hitSourceId: 'snow-courses-hit-source',
  hitLayerId: 'snow-courses-hit-layer',
  data: SNOW_COURSES_GEOJSON_URL,
  circleColor: '#8b4513',
  stateKey: 'hoveredSnowCourseStation',
})

export default snowCoursesLayer
