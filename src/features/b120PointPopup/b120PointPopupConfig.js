import {
  DEFAULT_TIMESERIES_LAYOUT,
  DEFAULT_TIMESERIES_PLOTLY_CONFIG,
  STATION_POPUP_WIDTH,
} from '../stationPopup/stationPopupConfig'

function formatCompactDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function parseDateString(dateString) {
  if (typeof dateString !== 'string') {
    return null
  }

  const trimmedDateString = dateString.trim()
  let normalizedDateString = null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDateString)) {
    normalizedDateString = trimmedDateString
  } else if (/^\d{8}$/.test(trimmedDateString)) {
    normalizedDateString = `${trimmedDateString.slice(0, 4)}-${trimmedDateString.slice(4, 6)}-${trimmedDateString.slice(6, 8)}`
  } else {
    return null
  }

  const parsedDate = new Date(`${normalizedDateString}T00:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function normalizeB120ForecastUpdateDate(dateString) {
  const parsedDate = parseDateString(dateString)

  if (!parsedDate) {
    return null
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function buildForecastDateRange(updateDate) {
  const parsedUpdateDate = parseDateString(updateDate)

  if (!parsedUpdateDate) {
    return null
  }

  const startDate = getFirstDayOfMonth(parsedUpdateDate)
  const endDate = getLastDayOfMonth(new Date(startDate.getFullYear(), startDate.getMonth() + 5, 1))

  return {
    startDate: formatCompactDate(startDate),
    updateDate: formatCompactDate(parsedUpdateDate),
    endDate: formatCompactDate(endDate),
  }
}

function buildB120MonthlyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/b120/csv/basins/nrt/combined/${stationId}_monthly.csv`
}

function buildB120DailyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/b120/csv/basins/nrt/combined/${stationId}_daily.csv`
}

function buildB120FcstUrl() {
  return ({ stationId, popupState }) => {
    const dateRange = buildForecastDateRange(
      popupState?.forecastUpdateDate ?? DEFAULT_B120_POINT_FORECAST_UPDATE_DATE,
    )
    const postProcessing =
      popupState?.forecastPostProcessing ?? DEFAULT_B120_POINT_POST_PROCESSING

    if (!dateRange) {
      return null
    }

    return `https://cw3e.ucsd.edu/hydro/b120/csv/basins/fcst/init${dateRange.startDate}_update${dateRange.updateDate}/${postProcessing}/${stationId}_${dateRange.startDate}-${dateRange.endDate}.csv`
  }
}

function buildB120DailyFcstUrl() {
  return ({ stationId, popupState }) => {
    const dateRange = buildForecastDateRange(
      popupState?.forecastUpdateDate ?? DEFAULT_B120_POINT_FORECAST_UPDATE_DATE,
    )

    if (!dateRange) {
      return null
    }

    return `https://cw3e.ucsd.edu/hydro/b120/csv/basins/fcst/init${dateRange.startDate}_update${dateRange.updateDate}/simulated/${stationId}_${dateRange.startDate}-${dateRange.endDate}_daily.csv`
  }
}

function buildEnsembleSeries(start = 1, end = 46) {
  return Object.fromEntries(
    Array.from({ length: end - start + 1 }, (_, index) => {
      const memberNumber = start + index
      const memberId = String(memberNumber).padStart(2, '0')
      const column = `Ens${memberId}`

      return [
        `Ens${memberId}`,
        {
          sourceId: 'fcst',
          column,
          line: { color: '#d3d3d3', width: 1 },
          yAxis: 'y',
          showlegend: false,
        },
      ]
    }),
  )
}

export const B120_POINT_POPUP_WIDTH = STATION_POPUP_WIDTH
export const B120_POINT_FORECAST_UPDATES_URL =
  'https://cw3e.ucsd.edu/hydro/b120/csv/fcst_tupdates.json'
export const B120_POINT_FORECAST_UPDATE_OPTIONS = [
  '2026-04-01',
  '2026-04-07',
  '2026-04-14',
]
export const DEFAULT_B120_POINT_FORECAST_UPDATE_DATE =
  B120_POINT_FORECAST_UPDATE_OPTIONS[B120_POINT_FORECAST_UPDATE_OPTIONS.length - 1]
export const B120_POINT_POST_PROCESSING_OPTIONS = [
  { id: 'cdfm', label: 'CDF Match' },
  { id: 'lstm_cdfm', label: 'LSTM' },
]
export const DEFAULT_B120_POINT_POST_PROCESSING = B120_POINT_POST_PROCESSING_OPTIONS[0].id

export function getB120PointPostProcessingLabel(postProcessingId) {
  return (
    B120_POINT_POST_PROCESSING_OPTIONS.find((option) => option.id === postProcessingId)?.label ??
    B120_POINT_POST_PROCESSING_OPTIONS[0].label
  )
}

export function doesB120PointTabUsePostProcessing(tabId) {
  return tabId === 'nrt-fcst'
}

export const B120_POINT_POPUP_TABS = [
  {
    id: 'nrt-fcst',
    label: 'NRT/Forecast',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: [
          {
            id: 'nrt',
            buildUrl: buildB120MonthlyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
          {
            id: 'fcst',
            buildUrl: buildB120FcstUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Basin: {basin}, Location: {location}<br />Post-Processing: {postProcessing}, Forecast Update: {updateDate}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 38,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        axes: {
          y: {
            title: { text: 'Monthly Flow (taf)', standoff: 0 },
          },
        },
        series: {
          ...buildEnsembleSeries(),
          simulated: {
            sourceId: 'nrt',
            column: 'Qsim',
            label: 'Model-simulated',
            line: { color: 'blue', width: 1 },
            yAxis: 'y',
          },
          matched: {
            sourceId: 'nrt',
            column: 'Qmatch',
            label: 'CDF-matched',
            line: { color: 'red', width: 1 },
            yAxis: 'y',
          },
          fnf: {
            sourceId: 'nrt',
            column: 'FNF',
            label: 'FNF',
            mode: 'markers',
            marker: {
              symbol: 'square',
              size: 8,
              color: 'black',
              line: { width: 0 } // optional (no outline)
            },
            yAxis: 'y',
          },
          avg: {
            sourceId: 'fcst',
            column: 'Avg',
            label: 'Historical Average',
            line: { color: 'black', width: 2, dash: 'dash' },
            yAxis: 'y',
          },
          exc50: {
            sourceId: 'fcst',
            column: 'Exc50',
            label: '50% Exceedance',
            mode: 'markers+lines',
            marker: {
              symbol: 'circle',
              size: 5,
              color: 'green',
              line: { width: 0 } // optional (no outline)
            },
            line: { color: 'green', width: 2 },
            yAxis: 'y',
          },
          exc90: {
            sourceId: 'fcst',
            column: 'Exc90',
            label: '90% Exceedance',
            mode: 'markers+lines',
            marker: {
              symbol: 'circle',
              size: 5,
              color: 'orange',
              line: { width: 0 } // optional (no outline)
            },
            line: { color: 'orange', width: 2 },
            yAxis: 'y',
          },
          exc10: {
            sourceId: 'fcst',
            column: 'Exc10',
            label: '10% Exceedance',
            mode: 'markers+lines',
            marker: {
              symbol: 'circle',
              size: 5,
              color: 'purple',
              line: { width: 0 } // optional (no outline)
            },
            line: { color: 'purple', width: 2 },
            yAxis: 'y',
          },
        },
      },
    ],
  },
  {
    id: 'nrt-fcst-daily',
    label: 'NRT/Forecast (Daily)',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: [
          {
            id: 'nrt',
            buildUrl: buildB120DailyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
          {
            id: 'fcst',
            buildUrl: buildB120DailyFcstUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Basin: {basin}, Location: {location}<br />Forecast Update: {updateDate}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 38,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        axes: {
          y: {
            title: { text: 'Daily Flow', standoff: 0 },
          },
        },
        series: {
          ...buildEnsembleSeries(),
          simulated: {
            sourceId: 'nrt',
            column: 'Qsim',
            label: 'Model-simulated',
            line: { color: 'blue', width: 1 },
            yAxis: 'y',
          },
          fnf: {
            sourceId: 'nrt',
            column: 'FNF',
            label: 'FNF',
            line: { color: 'black', width: 1 },
            yAxis: 'y',
          },
          exc50: {
            sourceId: 'fcst',
            column: 'Exc50',
            label: '50% Exceedance',
            line: { color: 'green', width: 2 },
            yAxis: 'y',
          },
          exc90: {
            sourceId: 'fcst',
            column: 'Exc90',
            label: '90% Exceedance',
            line: { color: 'orange', width: 2 },
            yAxis: 'y',
          },
          exc10: {
            sourceId: 'fcst',
            column: 'Exc10',
            label: '10% Exceedance',
            line: { color: 'purple', width: 2 },
            yAxis: 'y',
          },
        },
      },
    ],
  },
]

export function getB120PointPopupTabDefinition(tabId) {
  return B120_POINT_POPUP_TABS.find((tab) => tab.id === tabId) ?? null
}

export function getDefaultB120PointPopupTabId() {
  return B120_POINT_POPUP_TABS[0]?.id ?? 'nrt-forecast'
}
