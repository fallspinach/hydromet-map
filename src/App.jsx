import { useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import 'react-datepicker/dist/react-datepicker.css'
import './App.css'
import {
  BASEMAPS,
  createProjectState,
  DEFAULT_DATETIME,
  DEFAULT_PROJECT_ID,
  getProjectDefinition,
  getProjectRasterFamily,
} from './config/mapConfig'
import MapCanvas from './components/map/MapCanvas'
import {
  getDatePartFromDateTime,
  getTemporalModeForTimestep,
  mergeDateIntoDateTime,
  parseCenter,
  parseNumericValue,
  readStateFromUrl,
  writeStateToUrl,
} from './lib/appState'

const STATUS_URL = 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/status.json'
const STATUS_KEY = 'WRF-Hydro NRT'
const NRT_PRODUCT = 'NRT'
const FORECAST_PRODUCTS = ['WWRF-ECMWF', 'WWRF-GFS', 'GFS']

function formatStatusDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatStatusDateTime(date) {
  const datePart = formatStatusDate(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${datePart}T${hours}:${minutes}`
}

function parseStatusTimestamp(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return null
  }

  const normalizedValue = rawValue.trim()
  const parsedDirectly = new Date(normalizedValue)

  if (!Number.isNaN(parsedDirectly.getTime())) {
    return parsedDirectly
  }

  const normalizedUtcValue = normalizedValue
    .replace(' UTC', 'Z')
    .replace(' GMT', 'Z')
    .replace(' ', 'T')
  const parsedNormalizedValue = new Date(normalizedUtcValue)

  return Number.isNaN(parsedNormalizedValue.getTime()) ? null : parsedNormalizedValue
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function buildStatusBoundary(statusTimestamp) {
  const maxForecastTimestamp = addDays(statusTimestamp, 16)

  return {
    statusTimestamp: formatStatusDateTime(statusTimestamp),
    boundaryDate: formatStatusDate(statusTimestamp),
    boundaryDateTime: formatStatusDateTime(statusTimestamp),
    maxDate: formatStatusDate(maxForecastTimestamp),
    maxDateTime: formatStatusDateTime(maxForecastTimestamp),
  }
}

function getInitialStatusTimestamp() {
  return parseStatusTimestamp(DEFAULT_DATETIME) ?? new Date()
}

function applyTemporalModeToRasterState(rasterState, rasterFamily) {
  if (!rasterState || !rasterFamily) {
    return rasterState
  }

  const selectedVariable =
    rasterFamily.variables[rasterState.variable]
    ?? rasterFamily.variables[Object.keys(rasterFamily.variables)[0]]

  if (!selectedVariable) {
    return rasterState
  }

  const temporalMode = getTemporalModeForTimestep(selectedVariable.timestep)

  if (temporalMode === rasterState.temporalMode) {
    return rasterState
  }

  return {
    ...rasterState,
    date:
      temporalMode === 'date'
        ? getDatePartFromDateTime(rasterState.datetime, rasterState.date)
        : rasterState.date,
    datetime:
      temporalMode === 'datetime'
        ? mergeDateIntoDateTime(rasterState.date, rasterState.datetime)
        : rasterState.datetime,
    temporalMode,
  }
}

function constrainRasterStateToStatusBoundary(rasterState, statusBoundary) {
  if (!rasterState) {
    return rasterState
  }

  const nextRaster = { ...rasterState }

  if (nextRaster.date > statusBoundary.maxDate) {
    nextRaster.date = statusBoundary.maxDate
  }

  if (nextRaster.datetime > statusBoundary.maxDateTime) {
    nextRaster.datetime = statusBoundary.maxDateTime
  }

  const shouldUseForecastProducts =
    nextRaster.temporalMode === 'datetime'
      ? nextRaster.datetime > statusBoundary.boundaryDateTime
      : nextRaster.date > statusBoundary.boundaryDate

  const allowedProducts = shouldUseForecastProducts ? FORECAST_PRODUCTS : [NRT_PRODUCT]

  if (!allowedProducts.includes(nextRaster.product)) {
    nextRaster.product = allowedProducts[0]
  }

  return nextRaster
}

function updateActiveProjectState(current, updater) {
  const activeProjectId = current.activeProjectId ?? DEFAULT_PROJECT_ID
  const activeProjectState = current.projectStateById?.[activeProjectId] ?? createProjectState(activeProjectId)
  const nextProjectState = updater(activeProjectState, activeProjectId)

  if (nextProjectState === activeProjectState) {
    return current
  }

  return {
    ...current,
    projectStateById: {
      ...current.projectStateById,
      [activeProjectId]: nextProjectState,
    },
  }
}

function App() {
  const [appState, setAppState] = useState(() => readStateFromUrl())
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [copyStatus, setCopyStatus] = useState('Copy URL')
  const [selectedStation, setSelectedStation] = useState(null)
  const [bookmarkOpen, setBookmarkOpen] = useState(false)
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false)
  const [layerMenuOpen, setLayerMenuOpen] = useState(false)
  const bookmarkWidgetRef = useRef(null)
  const basemapMenuRef = useRef(null)
  const layerMenuRef = useRef(null)
  const [statusBoundary, setStatusBoundary] = useState(() =>
    buildStatusBoundary(getInitialStatusTimestamp()),
  )

  const activeProjectId = appState.activeProjectId ?? DEFAULT_PROJECT_ID
  const activeProject = getProjectDefinition(activeProjectId)
  const activeProjectState =
    appState.projectStateById?.[activeProjectId] ?? createProjectState(activeProjectId)
  const activeRasterFamily = getProjectRasterFamily(activeProjectId)
  const rasterVariables = activeRasterFamily?.variables ?? {}
  const rasterVariableIds = Object.keys(rasterVariables)
  const selectedVariable =
    rasterVariables[activeProjectState.raster?.variable]
    ?? rasterVariables[rasterVariableIds[0]]
    ?? null
  const selectedBasemap =
    BASEMAPS.find((item) => item.id === activeProjectState.basemapId) ?? BASEMAPS[0]
  const center = parseCenter(activeProjectState.view.center)
  const viewState = {
    longitude: center.longitude,
    latitude: center.latitude,
    zoom: parseNumericValue(activeProjectState.view.zoom, 5.3),
    bearing: parseNumericValue(activeProjectState.view.bearing, 0),
    pitch: parseNumericValue(activeProjectState.view.pitch, 0),
  }
  const terrainEnabled = selectedBasemap.terrainAvailable && activeProjectState.terrainEnabled

  useEffect(() => {
    if (copyStatus === 'Copied') {
      const timeoutId = window.setTimeout(() => {
        setCopyStatus('Copy URL')
      }, 1600)

      return () => window.clearTimeout(timeoutId)
    }

    return undefined
  }, [copyStatus])

  useEffect(() => {
    if (!basemapMenuOpen && !layerMenuOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!basemapMenuRef.current?.contains(event.target)) {
        setBasemapMenuOpen(false)
      }
      if (!layerMenuRef.current?.contains(event.target)) {
        setLayerMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [basemapMenuOpen, layerMenuOpen])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasExplicitRasterDate = params.has('date') || params.has('datetime')

    if (hasExplicitRasterDate) {
      return undefined
    }

    const abortController = new AbortController()

    async function loadStatusDefaults() {
      try {
        const response = await fetch(STATUS_URL, { signal: abortController.signal })

        if (!response.ok) {
          return
        }

        const statusData = await response.json()
        const statusTimestamp = parseStatusTimestamp(statusData?.[STATUS_KEY])

        if (!statusTimestamp) {
          return
        }

        const nextDate = formatStatusDate(statusTimestamp)
        const nextDateTime = formatStatusDateTime(statusTimestamp)
        setStatusBoundary(buildStatusBoundary(statusTimestamp))

        setAppState((current) => ({
          ...current,
          projectStateById: Object.fromEntries(
            Object.entries(current.projectStateById).map(([projectId, projectState]) => {
              const rasterFamily = getProjectRasterFamily(projectId)

              if (!rasterFamily || !projectState.raster) {
                return [projectId, projectState]
              }

              return [
                projectId,
                {
                  ...projectState,
                  raster: {
                    ...projectState.raster,
                    date:
                      projectState.raster.date === rasterFamily.defaultDate
                        ? nextDate
                        : projectState.raster.date,
                    datetime:
                      projectState.raster.datetime === rasterFamily.defaultDateTime
                        ? nextDateTime
                        : projectState.raster.datetime,
                  },
                },
              ]
            }),
          ),
        }))
      } catch (error) {
        if (error?.name !== 'AbortError') {
          // Keep the built-in defaults if the remote status file is unavailable.
        }
      }
    }

    loadStatusDefaults()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    setAppState((current) => ({
      ...current,
      projectStateById: Object.fromEntries(
        Object.entries(current.projectStateById).map(([projectId, projectState]) => {
          const rasterFamily = getProjectRasterFamily(projectId)

          if (!rasterFamily || !projectState.raster) {
            return [projectId, projectState]
          }

          return [
            projectId,
            {
              ...projectState,
              raster: constrainRasterStateToStatusBoundary(
                applyTemporalModeToRasterState(projectState.raster, rasterFamily),
                statusBoundary,
              ),
            },
          ]
        }),
      ),
    }))
  }, [statusBoundary])

  function updateTopLevel(key, value) {
    setAppState((current) =>
      updateActiveProjectState(current, (activeProjectStateValue) => ({
        ...activeProjectStateValue,
        [key]: value,
      })),
    )
  }

  function updateRaster(key, value) {
    setAppState((current) =>
      updateActiveProjectState(current, (activeProjectStateValue, projectId) => {
        const rasterFamily = getProjectRasterFamily(projectId)

        if (!rasterFamily || !activeProjectStateValue.raster) {
          return activeProjectStateValue
        }

        const nextRaster = {
          ...activeProjectStateValue.raster,
          [key]: value,
        }

        if (key === 'date') {
          nextRaster.datetime = mergeDateIntoDateTime(value, activeProjectStateValue.raster.datetime)
        }

        if (key === 'datetime') {
          nextRaster.date = getDatePartFromDateTime(value, activeProjectStateValue.raster.date)
        }

        if (key === 'variable') {
          const nextVariable =
            rasterFamily.variables[value]
            ?? rasterFamily.variables[Object.keys(rasterFamily.variables)[0]]
          const nextTemporalMode = getTemporalModeForTimestep(nextVariable?.timestep)
          nextRaster.temporalMode = nextTemporalMode

          if (nextTemporalMode === 'datetime') {
            nextRaster.datetime = mergeDateIntoDateTime(
              activeProjectStateValue.raster.date,
              activeProjectStateValue.raster.datetime,
            )
          }

          if (nextTemporalMode === 'date') {
            nextRaster.date = getDatePartFromDateTime(
              activeProjectStateValue.raster.datetime,
              activeProjectStateValue.raster.date,
            )
          }
        }

        return {
          ...activeProjectStateValue,
          raster: constrainRasterStateToStatusBoundary(nextRaster, statusBoundary),
        }
      }),
    )
  }

  function toggleLayer(layerId) {
    setAppState((current) =>
      updateActiveProjectState(current, (activeProjectStateValue) => ({
        ...activeProjectStateValue,
        layers: {
          ...activeProjectStateValue.layers,
          [layerId]: !activeProjectStateValue.layers[layerId],
        },
      })),
    )
  }

  function changeProject(nextProjectId) {
    if (nextProjectId === activeProjectId) {
      return
    }

    setSelectedStation(null)
    setAppState((current) => ({
      ...current,
      activeProjectId: nextProjectId,
      projectStateById: {
        ...current.projectStateById,
        [nextProjectId]: current.projectStateById[nextProjectId] ?? createProjectState(nextProjectId),
      },
    }))
  }

  function refreshBookmarkUrl() {
    const nextBookmarkUrl = writeStateToUrl(appState)
    setBookmarkUrl(nextBookmarkUrl)
    return nextBookmarkUrl
  }

  async function handleCopyBookmark() {
    try {
      const nextBookmarkUrl = refreshBookmarkUrl()
      await navigator.clipboard.writeText(nextBookmarkUrl)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  return (
    <div className="app-shell">
      <main className="map-stage">
        <MapCanvas
          activeProject={activeProject}
          activeProjectId={activeProjectId}
          appState={activeProjectState}
          basemapMenuRef={basemapMenuRef}
          basemapMenuOpen={basemapMenuOpen}
          bookmarkOpen={bookmarkOpen}
          bookmarkWidgetRef={bookmarkWidgetRef}
          copyStatus={copyStatus}
          layerMenuOpen={layerMenuOpen}
          layerMenuRef={layerMenuRef}
          onChangeProject={changeProject}
          onCloseBookmark={() => setBookmarkOpen(false)}
          onCopyBookmark={handleCopyBookmark}
          onToggleBookmark={() => {
            setBookmarkOpen((current) => {
              if (!current) {
                refreshBookmarkUrl()
              }
              return !current
            })
          }}
          bookmarkUrl={bookmarkUrl}
          rasterFamily={activeRasterFamily}
          selectedBasemap={selectedBasemap}
          selectedStation={selectedStation}
          selectedVariable={selectedVariable}
          setBasemapMenuOpen={setBasemapMenuOpen}
          setLayerMenuOpen={setLayerMenuOpen}
          setSelectedStation={setSelectedStation}
          statusBoundary={statusBoundary}
          terrainEnabled={terrainEnabled}
          toggleLayer={toggleLayer}
          updateRaster={updateRaster}
          updateTopLevel={updateTopLevel}
          viewState={viewState}
        />
      </main>
    </div>
  )
}

export default App
