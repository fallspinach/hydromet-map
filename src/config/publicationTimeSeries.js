export const CDEC_SWE_CATALOG_URL = import.meta.env.VITE_CDEC_SWE_CATALOG_URL
  || 'https://cw3e.ucsd.edu/hydro/hydro_ops/observations/cdec/swe/catalog.json'

export const CDEC_SWE_LAYERS = [
  { id: 'cdecSwePublicationTest', collectionId: 'hydro-ops-cdec-snow-pillow-swe',
    label: 'CDEC Snow Pillows — Publication Test', shortLabel: 'Snow Pillow',
    color: '#d65a9e', method: 'snow_pillow' },
  { id: 'cdecSnowCoursePublicationTest', collectionId: 'hydro-ops-cdec-snow-course-swe',
    label: 'CDEC Snow Courses — Publication Test', shortLabel: 'Snow Course',
    color: '#9c2878', method: 'snow_course' },
]
