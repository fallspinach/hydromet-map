import { getFamilyLayerIds, getFamilyState, getProjectFamilyIds, normalizeProjectFamilies } from './projectFamilies'
import {
  BASEMAPS,
  LAYER_FAMILIES,
  createDefaultAppState,
  DEFAULT_PROJECT_ID,
  getProjectDefinition,
  getProjectLayerFamily,
  getProjectMapLayers,
} from '../config/mapConfig'

function getDefaultProjectState(projectId = DEFAULT_PROJECT_ID) {
  return createDefaultAppState().projectStateById[projectId]
}

function getDefaultFamilyState(projectId = DEFAULT_PROJECT_ID) {
  return getDefaultProjectState(projectId)?.family ?? null
}

function getFirstParam(params, ...keys) {
  for (const key of keys) {
    const value = params.get(key)

    if (value !== null) {
      return value
    }
  }

  return null
}

function getSelectedStationBookmarkId(selectedStation) {
  return selectedStation?.id
    ?? selectedStation?.stationId
    ?? selectedStation?.reachId
    ?? selectedStation?.featureId
    ?? null
}

function formatBookmarkCoordinate(value) {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? parsedValue.toFixed(5) : ''
}

export function readPopupStateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const popupText = getFirstParam(params, 'pop', 'popup')
  const tabId = getFirstParam(params, 'tab', 'popupTab')
  const forecastProduct = getFirstParam(params, 'fprod', 'forecastProduct')
  const forecastUpdateDate = getFirstParam(params, 'fupd', 'forecastUpdateDate')
  const forecastPostProcessing = getFirstParam(params, 'fpp', 'forecastPostProcessing')

  if (!popupText) {
    return null
  }

  const [ownerLayerId, featureId, longitudeText, latitudeText] = popupText.split('|')
  const longitude = Number.parseFloat(longitudeText)
  const latitude = Number.parseFloat(latitudeText)

  if (!ownerLayerId || !featureId || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null
  }

  return {
    ownerLayerId,
    featureId,
    longitude,
    latitude,
    tabId: tabId || null,
    forecastProduct: forecastProduct || null,
    forecastUpdateDate: forecastUpdateDate || null,
    forecastPostProcessing: forecastPostProcessing || null,
  }
}

export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search)

  if (!params.toString()) {
    return createDefaultAppState()
  }

  const nextState = createDefaultAppState()
  const projectParam = getFirstParam(params, 'prj', 'project')

  if (getProjectDefinition(projectParam)?.id) {
    nextState.activeProjectId = getProjectDefinition(projectParam).id
  }

  const activeProjectId = nextState.activeProjectId
  const activeProjectState = nextState.projectStateById[activeProjectId]
  const project = getProjectDefinition(activeProjectId)
  const ids = getProjectFamilyIds(project)
  const requestedFamily = params.get('fam')
  const listedLayers = getFirstParam(params, 'lyr', 'layers')
  const layerIds = listedLayers?.split(',') ?? []
  const inferredFamily = ids.find((id) => getFamilyLayerIds(LAYER_FAMILIES[id]).some((key) => layerIds.includes(key)))
  // Legacy bookmarks without a family key keep their original primary-family meaning.
  const hasLegacyFamilySelection = ['var', 'variable', 'd', 'date', 'dt', 'datetime', 'prod', 'product'].some((key) => params.has(key))
  activeProjectState.activeFamilyId = ids.includes(requestedFamily)
    ? requestedFamily : inferredFamily ?? (hasLegacyFamilySelection ? project.layerFamilyId : activeProjectState.activeFamilyId)
  const layerFamily = getProjectLayerFamily(activeProjectId, activeProjectState.activeFamilyId)
  const familyState = getFamilyState(activeProjectState, project, layerFamily?.id)
  if (listedLayers === null && ids.length > 1 && layerFamily?.raster?.layerId) {
    activeProjectState.layers[layerFamily.raster.layerId] = true
  }
  const familyVariables = layerFamily?.raster?.variables ?? {}
  const familyProducts = layerFamily?.selectors?.products ?? []
  const familyEnsembleTraces = layerFamily?.selectors?.ensembleTraces ?? []
  const basemapId = getFirstParam(params, 'bm', 'basemap')
  const projection = getFirstParam(params, 'proj', 'projection')
  const terrain = getFirstParam(params, 'ter', 'terrain')
  const center = getFirstParam(params, 'c', 'center')
  const zoom = getFirstParam(params, 'z', 'zoom')
  const bearing = getFirstParam(params, 'brg', 'bearing')
  const pitch = getFirstParam(params, 'pit', 'pitch')
  const variable = getFirstParam(params, 'var', 'variable')
  const product = getFirstParam(params, 'prod', 'product')
  const ensemble = getFirstParam(params, 'ens', 'ensemble')
  const temporalMode = getFirstParam(params, 'tm', 'temporalMode')
  const date = getFirstParam(params, 'd', 'date')
  const datetime = getFirstParam(params, 'dt', 'datetime')
  const layers = getFirstParam(params, 'lyr', 'layers')

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

  if (familyState && layerFamily) {
    if (Object.hasOwn(familyVariables, variable)) {
      familyState.variable = variable
    }

    if (familyProducts.includes(product)) {
      familyState.product = product
    }

    if (familyEnsembleTraces.includes(ensemble)) {
      familyState.ensemble = ensemble
    }

    if (temporalMode === 'date' || temporalMode === 'datetime') {
      familyState.temporalMode = temporalMode
    }

    if (date) {
      familyState.date = date
    }

    if (datetime) {
      familyState.datetime = datetime
    }

    Object.entries(layerFamily.bookmarkFields ?? {}).forEach(([field, paramKey]) => {
      const bookmarkedValue = params.get(paramKey)

      if (bookmarkedValue === null) {
        return
      }

      const defaultValue = familyState[field]
      if (Array.isArray(defaultValue)) {
        familyState[field] = bookmarkedValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
        return
      }

      if (typeof defaultValue === 'boolean') {
        if (bookmarkedValue === 'true' || bookmarkedValue === 'false') {
          familyState[field] = bookmarkedValue === 'true'
        }
        return
      }

      familyState[field] = bookmarkedValue
    })
  }

  if (layers !== null) {
    const enabledIds = new Set(layers.split(','))
    getProjectMapLayers(activeProjectId).forEach((layer) => {
      activeProjectState.layers[layer.id] = enabledIds.has(layer.id)
    })
  }

  nextState.projectStateById[activeProjectId] = normalizeProjectFamilies(
    activeProjectState, project, LAYER_FAMILIES,
  )
  return nextState
}

export function writeStateToUrl(state, { selectedStation = null } = {}) {
  const params = new URLSearchParams()
  const activeProjectId = state.activeProjectId ?? DEFAULT_PROJECT_ID
  const activeProjectState = state.projectStateById?.[activeProjectId] ?? getDefaultProjectState(activeProjectId)
  const project = getProjectDefinition(activeProjectId)
  const layerFamily = getProjectLayerFamily(activeProjectId, activeProjectState.activeFamilyId)
  const familyState = getFamilyState(activeProjectState, project, layerFamily?.id)
  const multiFamily = getProjectFamilyIds(project).length > 1
  const familyVisible = getFamilyLayerIds(layerFamily).some((id) => activeProjectState.layers[id])
  if (multiFamily && familyVisible) params.set('fam', layerFamily.id)

  params.set('prj', activeProjectId)
  params.set('bm', activeProjectState.basemapId)
  params.set('proj', activeProjectState.projection)
  params.set('ter', String(activeProjectState.terrainEnabled))
  params.set('c', activeProjectState.view.center)
  params.set('z', activeProjectState.view.zoom)
  params.set('brg', activeProjectState.view.bearing)
  params.set('pit', activeProjectState.view.pitch)

  if (familyState && (!multiFamily || familyVisible)) {
    if (Object.hasOwn(familyState, 'variable')) {
      params.set('var', familyState.variable || getDefaultFamilyState(activeProjectId)?.variable || '')
    }
    if (Object.hasOwn(familyState, 'product')) {
      params.set('prod', familyState.product)
    }
    if (Object.hasOwn(familyState, 'ensemble')) {
      params.set('ens', familyState.ensemble)
    }
    if (Object.hasOwn(familyState, 'temporalMode')) {
      params.set('tm', familyState.temporalMode)
    }
    if (Object.hasOwn(familyState, 'date')) {
      params.set('d', familyState.date)
    }
    if (Object.hasOwn(familyState, 'datetime')) {
      params.set('dt', familyState.datetime)
    }

    Object.entries(layerFamily?.bookmarkFields ?? {}).forEach(([field, paramKey]) => {
      const value = familyState[field]
      const serializedValue = Array.isArray(value) ? value.join(',') : value
      if (serializedValue !== undefined && serializedValue !== null && serializedValue !== '') {
        params.set(paramKey, String(serializedValue))
      }
    })
  }

  params.set(
    'lyr',
    getProjectMapLayers(activeProjectId)
      .filter((layer) => activeProjectState.layers[layer.id])
      .map((layer) => layer.id)
      .join(','),
  )

  const selectedStationBookmarkId = getSelectedStationBookmarkId(selectedStation)
  const selectedStationLayerId = selectedStation?.popupOwnerId ?? selectedStation?.layerId ?? null
  const selectedStationLongitude = formatBookmarkCoordinate(selectedStation?.longitude)
  const selectedStationLatitude = formatBookmarkCoordinate(selectedStation?.latitude)

  if (
    selectedStationLayerId
    && selectedStationBookmarkId != null
    && selectedStationLongitude
    && selectedStationLatitude
  ) {
    params.set(
      'pop',
      [
        selectedStationLayerId,
        selectedStationBookmarkId,
        selectedStationLongitude,
        selectedStationLatitude,
      ].join('|'),
    )

    if (selectedStation?.popup?.activeTabId) {
      params.set('tab', selectedStation.popup.activeTabId)
    }

    if (selectedStation?.popup?.forecastProduct) {
      params.set('fprod', selectedStation.popup.forecastProduct)
    }

    if (selectedStation?.popup?.forecastUpdateDate) {
      params.set('fupd', selectedStation.popup.forecastUpdateDate)
    }

    if (selectedStation?.popup?.forecastPostProcessing) {
      params.set('fpp', selectedStation.popup.forecastPostProcessing)
    }
  }

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

export function getDatePartFromDateTime(datetimeText, fallbackDate = getDefaultFamilyState()?.date ?? '2026-04-13') {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeText)
    ? datetimeText.slice(0, 10)
    : fallbackDate
}

export function mergeDateIntoDateTime(dateText, datetimeText, fallbackTime = '12:00') {
  const datePart = parseIsoDate(dateText) ? dateText : (getDefaultFamilyState()?.date ?? '2026-04-13')
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
