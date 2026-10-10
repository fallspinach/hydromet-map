import { MATPLOTLIB_COLORMAPS } from '../config/colorMaps.js'

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

function resolveAsset(file, manifestUrl) {
  if (typeof file !== 'string' || !file) throw new Error('Missing image filename')
  const url = new URL(file, manifestUrl)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported image URL')
  return url.href
}

export function buildManifestRasterFamily(definition, manifest) {
  const coordinates = manifest.maplibre_coordinates_lon_lat
  if (!Array.isArray(coordinates) || coordinates.length !== 4 || coordinates.some(
    (point) => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)
      || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90,
  )) throw new Error('Invalid image coordinates')
  if (manifest.crs !== 'EPSG:3857' || !Array.isArray(manifest.images)) {
    throw new Error('Unsupported raster manifest')
  }
  const scale = manifest.color_scale
  if (!Number.isFinite(scale?.vmin) || !Number.isFinite(scale?.vmax) || scale.vmin >= scale.vmax) {
    throw new Error('Invalid color scale')
  }
  const colors = MATPLOTLIB_COLORMAPS[scale.cmap]
  const palette = colors ? {
    colors,
    thresholds: Array.from({ length: colors.length + 1 }, (_, index) =>
      String(Number((scale.vmin + (scale.vmax - scale.vmin) * index / colors.length).toFixed(6)))),
  } : {
    imageUrl: resolveAsset(scale.legend, definition.manifestUrl),
    min: scale.vmin,
    max: scale.vmax,
    name: scale.cmap,
  }
  const variables = Object.fromEntries(Object.entries(definition.raster.variables).map(([id, variable]) => {
    const images = manifest.images.filter((item) => item.index?.toLowerCase() === id
      && isIsoDate(item.date) && Number.isFinite(item.valid_pixels) && item.valid_pixels > 0)
    const imageByDate = Object.fromEntries(images.map((item) => [
      item.date, resolveAsset(item.file, definition.manifestUrl),
    ]))
    const availableDates = Object.keys(imageByDate).sort()
    return [id, {
      ...variable,
      availableDates,
      coordinates,
      palette,
      resampling: manifest.resampling === 'nearest' ? 'nearest' : 'linear',
      buildRasterUrl: ({ date }) => imageByDate[date] ?? null,
    }]
  }))
  if (!Object.values(variables).some((variable) => variable.availableDates.length)) {
    throw new Error('No nonempty observations available')
  }
  return { ...definition, raster: { ...definition.raster, variables } }
}

export function normalizeManifestSelection(state, family) {
  const variables = family.raster.variables
  const variable = variables[state.variable]?.availableDates.length
    ? state.variable
    : Object.keys(variables).find((id) => variables[id].availableDates.length)
  if (!variable) return state
  const dates = variables[variable].availableDates
  // Default to latest; unavailable bookmarks/variable switches use the preceding observation.
  const date = dates.includes(state.date) ? state.date
    : !state.date ? dates.at(-1) : dates.findLast((item) => item <= state.date) ?? dates[0]
  return variable === state.variable && date === state.date ? state : { ...state, variable, date }
}
