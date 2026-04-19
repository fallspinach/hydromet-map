import {
  BASEMAPS,
  createDefaultAppState,
  DEFAULT_PROJECT_ID,
  getProjectDefinition,
  getProjectMapLayers,
  getProjectRasterFamily,
} from '../config/mapConfig'

function getDefaultProjectState(projectId = DEFAULT_PROJECT_ID) {
  return createDefaultAppState().projectStateById[projectId]
}

function getDefaultRasterState(projectId = DEFAULT_PROJECT_ID) {
  return getDefaultProjectState(projectId)?.raster ?? null
}

export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search)

  if (!params.toString()) {
    return createDefaultAppState()
  }

  const nextState = createDefaultAppState()
  const projectParam = params.get('project')

  if (getProjectDefinition(projectParam)?.id) {
    nextState.activeProjectId = getProjectDefinition(projectParam).id
  }

  const activeProjectId = nextState.activeProjectId
  const activeProjectState = nextState.projectStateById[activeProjectId]
  const rasterFamily = getProjectRasterFamily(activeProjectId)
  const basemapId = params.get('basemap')
  const projection = params.get('projection')
  const terrain = params.get('terrain')
  const center = params.get('center')
  const zoom = params.get('zoom')
  const bearing = params.get('bearing')
  const pitch = params.get('pitch')
  const variable = params.get('variable')
  const product = params.get('product')
  const ensemble = params.get('ensemble')
  const temporalMode = params.get('temporalMode')
  const date = params.get('date')
  const datetime = params.get('datetime')
  const layers = params.get('layers')

  if (BASEMAPS.some((item) => item.id === basemapId)) {
    activeProjectState.basemapId = basemapId
  }

  if (projection === 'globe' || projection === 'mercator') {
    activeProjectState.projection = projection
  }

  if (terrain === 'true' || terrain === 'false') {
    activeProjectState.terrainEnabled = terrain === 'true'
  }

  if (center) {
    activeProjectState.view.center = center
  }

  if (zoom) {
    activeProjectState.view.zoom = zoom
  }

  if (bearing) {
    activeProjectState.view.bearing = bearing
  }

  if (pitch) {
    activeProjectState.view.pitch = pitch
  }

  if (activeProjectState.raster && rasterFamily) {
    if (Object.hasOwn(rasterFamily.variables, variable)) {
      activeProjectState.raster.variable = variable
    }

    if (rasterFamily.products.includes(product)) {
      activeProjectState.raster.product = product
    }

    if (rasterFamily.ensembleTraces.includes(ensemble)) {
      activeProjectState.raster.ensemble = ensemble
    }

    if (temporalMode === 'date' || temporalMode === 'datetime') {
      activeProjectState.raster.temporalMode = temporalMode
    }

    if (date) {
      activeProjectState.raster.date = date
    }

    if (datetime) {
      activeProjectState.raster.datetime = datetime
    }
  }

  if (layers) {
    const enabledIds = new Set(layers.split(','))
    getProjectMapLayers(activeProjectId).forEach((layer) => {
      activeProjectState.layers[layer.id] = enabledIds.has(layer.id)
    })
  }

  return nextState
}

export function writeStateToUrl(state) {
  const params = new URLSearchParams()
  const activeProjectId = state.activeProjectId ?? DEFAULT_PROJECT_ID
  const activeProjectState = state.projectStateById?.[activeProjectId] ?? getDefaultProjectState(activeProjectId)

  params.set('project', activeProjectId)
  params.set('basemap', activeProjectState.basemapId)
  params.set('projection', activeProjectState.projection)
  params.set('terrain', String(activeProjectState.terrainEnabled))
  params.set('center', activeProjectState.view.center)
  params.set('zoom', activeProjectState.view.zoom)
  params.set('bearing', activeProjectState.view.bearing)
  params.set('pitch', activeProjectState.view.pitch)

  if (activeProjectState.raster) {
    params.set('variable', activeProjectState.raster.variable || getDefaultRasterState(activeProjectId)?.variable || '')
    params.set('product', activeProjectState.raster.product)
    params.set('ensemble', activeProjectState.raster.ensemble)
    params.set('temporalMode', activeProjectState.raster.temporalMode)
    params.set('date', activeProjectState.raster.date)
    params.set('datetime', activeProjectState.raster.datetime)
  }

  params.set(
    'layers',
    getProjectMapLayers(activeProjectId)
      .filter((layer) => activeProjectState.layers[layer.id])
      .map((layer) => layer.id)
      .join(','),
  )

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

export function parseCenter(centerText) {
  const [longitudeText, latitudeText] = centerText.split(',')
  const longitude = Number.parseFloat(longitudeText)
  const latitude = Number.parseFloat(latitudeText)

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return { longitude: -120.5, latitude: 37.2 }
  }

  return { longitude, latitude }
}

export function parseNumericValue(value, fallback) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseIsoDate(dateText) {
  const matchedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(`${dateText}T00:00:00`) : null
  return matchedDate && !Number.isNaN(matchedDate.getTime()) ? matchedDate : null
}

export function getTemporalModeForTimestep(timestep) {
  const matched = /^(\d+)(hour|day|month)$/.exec(timestep)

  if (!matched) {
    return 'date'
  }

  const [, amountText, unit] = matched
  const amount = Number.parseInt(amountText, 10)

  if (!Number.isFinite(amount)) {
    return 'date'
  }

  return unit === 'hour' && amount < 24 ? 'datetime' : 'date'
}

export function parseTimestep(timestep) {
  const matched = /^(\d+)(hour|day|month)$/.exec(timestep)

  if (!matched) {
    return { amount: 1, unit: 'day' }
  }

  const [, amountText, unit] = matched
  const amount = Number.parseInt(amountText, 10)

  if (!Number.isFinite(amount)) {
    return { amount: 1, unit: 'day' }
  }

  return { amount, unit }
}

export function parseIsoDateTime(datetimeText) {
  const matchedDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeText)
    ? new Date(`${datetimeText}:00`)
    : null
  return matchedDateTime && !Number.isNaN(matchedDateTime.getTime()) ? matchedDateTime : null
}

export function getDatePartFromDateTime(datetimeText, fallbackDate = getDefaultRasterState()?.date ?? '2026-04-13') {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeText)
    ? datetimeText.slice(0, 10)
    : fallbackDate
}

export function mergeDateIntoDateTime(dateText, datetimeText, fallbackTime = '12:00') {
  const datePart = parseIsoDate(dateText) ? dateText : (getDefaultRasterState()?.date ?? '2026-04-13')
  const timePart = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeText)
    ? datetimeText.slice(11, 16)
    : fallbackTime

  return `${datePart}T${timePart}`
}

export function formatCoordinate(value) {
  return value.toFixed(4)
}

export function formatViewValue(value, digits = 2) {
  return value.toFixed(digits)
}

export function formatLatLon(value) {
  return value.toFixed(4)
}

export function formatCoordinateLabel(value, positiveLabel, negativeLabel) {
  const absoluteValue = Math.abs(value)
  const direction = value >= 0 ? positiveLabel : negativeLabel
  return `${formatLatLon(absoluteValue)}°${direction}`
}

export function shiftIsoDate(dateText, days) {
  const currentDate = parseIsoDate(dateText)

  if (!currentDate) {
    return dateText
  }

  currentDate.setDate(currentDate.getDate() + days)
  return currentDate.toISOString().slice(0, 10)
}

export function shiftIsoMonth(dateText, months) {
  const currentDate = parseIsoDate(dateText)

  if (!currentDate) {
    return dateText
  }

  const originalDay = currentDate.getDate()
  currentDate.setDate(1)
  currentDate.setMonth(currentDate.getMonth() + months)
  const lastDayOfTargetMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate()
  currentDate.setDate(Math.min(originalDay, lastDayOfTargetMonth))
  return currentDate.toISOString().slice(0, 10)
}

export function formatIsoDateTimeLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function shiftIsoDateTime(datetimeText, days = 0, hours = 0) {
  const currentDate = parseIsoDateTime(datetimeText)

  if (!currentDate) {
    return datetimeText
  }

  currentDate.setHours(currentDate.getHours() + hours)
  currentDate.setDate(currentDate.getDate() + days)
  return formatIsoDateTimeLocal(currentDate)
}
