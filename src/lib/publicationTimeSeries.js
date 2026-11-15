import { fetchAndParseCsv } from './csvData.js'

export function createPublishedStation(feature, definition) {
  return {
    id: feature.properties.station_id, name: feature.properties.name,
    longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1],
    layerId: definition.id, popupOwnerId: definition.id, popupType: 'publication-time-series',
    measurementLabel: definition.shortLabel,
  }
}

export async function loadTimeSeriesCatalog(url) {
  if (!url) throw new Error('CDEC SWE catalog URL has not been configured.')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Cannot load observation catalog (${response.status}).`)
  const catalog = await response.json()
  if (!['hydro-ops-observation-index-v1', 'hydro-ops-observation-pilot-index-v1'].includes(catalog.schema) || !Array.isArray(catalog.layers)) {
    throw new Error('Unsupported observation catalog.')
  }
  const ids = catalog.layers.map(layer => layer.id)
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate collection IDs in catalog.')
  return { catalog, url }
}

// Deliberately scoped to the reviewed CDEC publication, not every proposed collection.
export async function loadTimeSeriesCollection(url) {
  if (!url) throw new Error('CDEC SWE test publication URL has not been configured.')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Cannot load collection (${response.status}).`)
  const collection = await response.json()
  if (collection.convention !== 'hydromet-feature-timeseries-proposal'
    || collection.conventionVersion !== '0.1-draft'
    || collection.variables?.swe?.unit !== 'mm'
    || collection.variables?.swe?.authoritativePlotColumn !== 'swe_display_mm'
    || collection.time?.plotColumn !== 'timestamp_pst'
    || !collection.variables?.swe?.validationAlreadyApplied) {
    throw new Error('Unsupported time-series publication profile.')
  }
  const geometryUrl = new URL(collection.geometry.href, url).href
  const geometryResponse = await fetch(geometryUrl)
  if (!geometryResponse.ok) throw new Error(`Cannot load stations (${geometryResponse.status}).`)
  const geometry = await geometryResponse.json()
  return { collection, geometry, url }
}

export function normalizePublishedRows(rows, collection, series) {
  const variable = collection.variables[series.variable]
  const seen = new Set()
  return rows.map(row => {
    for (const binding of Object.values(collection.seriesKeyBindings)) {
      const value = binding.column ? row[binding.column] : binding.constant
      if (('constant' in binding && value !== binding.constant)
        || (binding.matchesSeriesField && value !== series[binding.matchesSeriesField])) {
        throw new Error('CSV record does not match its declared series.')
      }
    }
    const key = collection.csv.recordKey.map(field => row[field]).join('|')
    if (seen.has(key)) throw new Error('Duplicate time-series record.')
    seen.add(key)
    const timestamp = row[collection.time.plotColumn]
    if (!/^\d{4}-\d{2}-\d{2}T/.test(timestamp) || !Number.isFinite(Date.parse(timestamp))) {
      throw new Error('Invalid reporting timestamp.')
    }
    const status = collection.quality.displayStatusDictionary[row[variable.qualityColumn]]
    if (!status) throw new Error('Unknown display status in CSV.')
    const raw = row[variable.authoritativePlotColumn]
    const missing = collection.csv.missingTokens.includes(raw)
    const value = missing ? null : Number(raw)
    if (!missing && !Number.isFinite(value)) throw new Error('Invalid numeric SWE value.')
    const range = variable.validRange ?? {}
    const minimum = range.minimum ?? range.min
    const maximum = range.maximum ?? range.max
    const outside = value !== null && (
      (minimum != null && (range.includeMinimum === false ? value <= minimum : value < minimum))
      || (maximum != null && (range.includeMaximum === false ? value >= maximum : value > maximum)))
    return {
      // Date strings intentionally preserve reporting dates across browser zones.
      date: timestamp.slice(0, 10),
      value: status.exclude || outside ? null : value,
      observationDate: row[collection.time.observationTimeColumn]?.slice(0, 10) || 'Not reported',
      providerFlag: row[collection.quality.providerColumn] ?? '',
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export async function loadPublishedSeries(publication, series) {
  const { collection, url } = publication
  const assets = collection.assets.filter(asset => asset.seriesId === series.id)
  if (!assets.length) throw new Error('No assets published for this series.')
  const tables = await Promise.all(assets.map(async asset => {
    if (asset.mediaType !== 'text/csv' || !['none', 'gzip'].includes(asset.fileCompression)) {
      throw new Error('Unsupported time-series asset format.')
    }
    const table = await fetchAndParseCsv(new URL(asset.href, url).href, { dynamicTyping: false })
    for (const field of Object.keys(asset.columns)) {
      if (!table.fields.includes(field)) throw new Error(`Missing CSV column: ${field}`)
    }
    return table.rows
  }))
  return normalizePublishedRows(tables.flat(), collection, series)
}

export function publishedSwePlot(rows, series, unit) {
  const divisor = unit === 'in' ? 25.4 : 1
  const course = series.resolution === 'monthly'
  const plotRows = []
  let previousMonth
  for (const row of rows) {
    const month = Number(row.date.slice(0, 4)) * 12 + Number(row.date.slice(5, 7))
    // Survey reporting labels are not monthly averages. Only join adjacent
    // reporting months; absent months must break the line, including seasons.
    if (course && previousMonth !== undefined && month - previousMonth !== 1) {
      plotRows.push({ date: null, value: null })
    }
    plotRows.push(row)
    previousMonth = month
  }
  return {
    plotId: series.id, traceFingerprint: unit,
    titleText: series.label,
    traces: [{ type: 'scatter', mode: course ? 'lines+markers' : 'lines', name: series.label,
      x: plotRows.map(row => row.date), y: plotRows.map(row => row.value === null ? null : row.value / divisor),
      connectgaps: false, line: { color: course ? '#9c2878' : '#d65a9e', width: 1.5 },
      marker: { color: '#9c2878', size: 7 },
      customdata: plotRows.map(row => [row.observationDate, row.providerFlag]),
      hovertemplate: `Reporting date: %{x|%Y-%m-%d}<br>%{y:.2f} ${unit}<br>Observation date: %{customdata[0]}<br>Provider flag: %{customdata[1]}<extra></extra>` }],
    xAxisLayout: { type: 'date', title: { text: 'Reporting date' } },
    yAxesLayout: { yaxis: { title: { text: `SWE (${unit})` }, automargin: true, rangemode: 'tozero' } },
    layout: { autosize: true, showlegend: false, margin: { l: 55, r: 15, t: 45, b: 55 } },
    plotlyConfig: { displaylogo: false, responsive: true },
  }
}
