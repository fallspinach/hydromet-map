import {
  DEFAULT_TIMESERIES_LAYOUT,
  DEFAULT_TIMESERIES_PLOTLY_CONFIG,
  TIMESERIES_POPUP_WIDTH,
} from '../cnrfcPointPopup/cnrfcPointPopupConfig'
import { buildCsvDownloadFileName } from '../../lib/csvExport'

function formatCompactDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatMonthYearLabel(value) {
  const parsedDate = parseDateString(String(value ?? ''))

  if (!parsedDate) {
    return value ?? ''
  }

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatIntegerValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.round(value))
  }

  const parsedValue = Number.parseFloat(value)

  return Number.isFinite(parsedValue) ? String(Math.round(parsedValue)) : (value ?? '')
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

export function normalizeYampaForecastUpdateDate(dateString) {
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
  const endDate = new Date(startDate.getFullYear(), 8, 30)

  return {
    startDate: formatCompactDate(startDate),
    updateDate: formatCompactDate(parsedUpdateDate),
    endDate: formatCompactDate(endDate),
  }
}

function buildYampaMonthlyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/nrt/combined/${stationId}_monthly.csv`
}

function buildYampaDailyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/nrt/combined/${stationId}_daily.csv`
}

function buildYampaRetroMonthlyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/retro/combined/${stationId}_monthly.csv`
}

function buildYampaRetroDailyNrtUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/retro/combined/${stationId}_daily.csv`
}

function buildYampaFcstUrl() {
  return ({ stationId, popupState }) => {
    const dateRange = buildForecastDateRange(
      popupState?.forecastUpdateDate ?? DEFAULT_YAMPA_POINT_FORECAST_UPDATE_DATE,
    )
    const postProcessing =
      popupState?.forecastPostProcessing ?? DEFAULT_YAMPA_POINT_POST_PROCESSING

    if (!dateRange) {
      return null
    }

    return `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/fcst/init${dateRange.startDate}_update${dateRange.updateDate}/${postProcessing}/${stationId}_${dateRange.startDate}-${dateRange.endDate}.csv`
  }
}

function buildYampaDailyFcstUrl() {
  return ({ stationId, popupState }) => {
    const dateRange = buildForecastDateRange(
      popupState?.forecastUpdateDate ?? DEFAULT_YAMPA_POINT_FORECAST_UPDATE_DATE,
    )
    const postProcessing =
      popupState?.forecastPostProcessing ?? DEFAULT_YAMPA_POINT_POST_PROCESSING

    if (!dateRange) {
      return null
    }

    return `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/fcst/init${dateRange.startDate}_update${dateRange.updateDate}/${postProcessing}/${stationId}_${dateRange.startDate}-${dateRange.endDate}_daily.csv`
  }
}

function buildYampaRetroMonthlyLstmUrl() {
  return ({ stationId }) =>
    `https://cw3e.ucsd.edu/hydro/yampa/csv/basins/retro/lstm_cdfm/${stationId}_monthly.csv`
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

function buildYampaCsvDownloadFileName(context) {
  const stationId = context.station?.stationId ?? 'station'
  const popupState = context.popupState ?? {}
  const extraParts = [
    popupState.forecastUpdateDate,
    popupState.forecastPostProcessing,
    context.exportType === 'table' ? 'table' : null,
  ]

  return buildCsvDownloadFileName({
    prefix: 'yampa',
    stationId,
    plotId: context.plotDefinition?.id,
    sourceId: context.sourceId,
    defaultFileName: context.defaultFileName,
    extraParts,
  })
}

export const YAMPA_POINT_POPUP_WIDTH = TIMESERIES_POPUP_WIDTH
export const YAMPA_POINT_FORECAST_UPDATES_URL =
  'https://cw3e.ucsd.edu/hydro/yampa/csv/fcst_tupdates.json'
export const YAMPA_POINT_FORECAST_UPDATE_OPTIONS = [
  '2026-03-30',
  '2026-04-06',
  '2026-04-13',
]
export const DEFAULT_YAMPA_POINT_FORECAST_UPDATE_DATE =
  YAMPA_POINT_FORECAST_UPDATE_OPTIONS[YAMPA_POINT_FORECAST_UPDATE_OPTIONS.length - 1]
export const YAMPA_POINT_POST_PROCESSING_OPTIONS = [
  { id: 'cdfm', label: 'CDF Match' },
  { id: 'simulated', label: 'None' },
]
export const DEFAULT_YAMPA_POINT_POST_PROCESSING = YAMPA_POINT_POST_PROCESSING_OPTIONS[0].id
export const INITIAL_YAMPA_POINT_FORECAST_UPDATE_DATE = DEFAULT_YAMPA_POINT_FORECAST_UPDATE_DATE

export function getYampaPointPostProcessingLabel(postProcessingId) {
  return (
    YAMPA_POINT_POST_PROCESSING_OPTIONS.find((option) => option.id === postProcessingId)?.label ??
    YAMPA_POINT_POST_PROCESSING_OPTIONS[0].label
  )
}

export function doesYampaPointTabUsePostProcessing(tabId) {
  return tabId === 'nrt-fcst' || tabId === 'nrt-fcst-daily' || tabId === 'forecast-summary'
}

export function doesYampaPointTabUseForecastUpdate(tabId) {
  return tabId === 'nrt-fcst' || tabId === 'nrt-fcst-daily' || tabId === 'forecast-summary'
}

export const YAMPA_POINT_POPUP_TABS = [
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
            buildUrl: buildYampaMonthlyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
          {
            id: 'fcst',
            buildUrl: buildYampaFcstUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Name: {name}<br />Post-Processing: {postProcessing}, Forecast Update: {updateDate}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 38,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildYampaCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Monthly Flow (af)', standoff: 0 },
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
            scaleFactor: 1000,
          },
          matched: {
            sourceId: 'nrt',
            column: 'Qmatch',
            label: 'CDF-matched',
            line: { color: 'red', width: 1 },
            yAxis: 'y',
            scaleFactor: 1000,
          },
          avg: {
            sourceId: 'fcst',
            column: 'Avg',
            label: 'Historical Average',
            line: { color: 'black', width: 2, dash: 'dash' },
            yAxis: 'y',
            scaleFactor: 1000,
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
            scaleFactor: 1000,
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
            scaleFactor: 1000,
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
            scaleFactor: 1000,
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
            buildUrl: buildYampaDailyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
          {
            id: 'fcst',
            buildUrl: buildYampaDailyFcstUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Name: {name}<br />Post-Processing: {postProcessing}, Forecast Update: {updateDate}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 38,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildYampaCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Daily Flow (cfs)', standoff: 0 },
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
  {
    id: 'retrospective',
    label: 'Retrospective',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: [
          {
            id: 'retro',
            buildUrl: buildYampaRetroMonthlyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
          {
            id: 'lstm',
            buildUrl: buildYampaRetroMonthlyLstmUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Name: {name}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 30,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildYampaCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Monthly Flow (af)', standoff: 0 },
          },
        },
        series: {
          simulated: {
            sourceId: 'retro',
            column: 'Qsim',
            label: 'Model-simulated',
            line: { color: 'blue', width: 1 },
            yAxis: 'y',
            scaleFactor: 1000,
          },
          matched: {
            sourceId: 'retro',
            column: 'Qmatch',
            label: 'CDF-matched',
            line: { color: 'red', width: 1 },
            yAxis: 'y',
            scaleFactor: 1000,
          },
          lstm: {
            sourceId: 'lstm',
            column: 'Qmatch',
            label: 'LSTM',
            line: { color: 'magenta', width: 1 },
            yAxis: 'y',
            scaleFactor: 1000,
          },
          fnf: {
            sourceId: 'retro',
            column: 'FNF',
            label: 'FNF',
            mode: 'markers+lines',
            marker: {
              symbol: 'square',
              size: 3,
              color: 'black',
              line: { width: 0 },
            },
            line: { color: 'black', width: 1 },
            yAxis: 'y',
            scaleFactor: 1000,
          },
        },
      },
    ],
  },
  {
    id: 'retrospective-daily',
    label: 'Retrospective (Daily)',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: [
          {
            id: 'retro',
            buildUrl: buildYampaRetroDailyNrtUrl(),
            transformRows: ({ rows }) => rows.slice(0, -1),
          },
        ],
        hovermode: 'x unified',
        titleTemplate: 'Station ID: {stationId}, Name: {name}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 30,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildYampaCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Daily Flow (cfs)', standoff: 0 },
          },
        },
        series: {
          simulated: {
            sourceId: 'retro',
            column: 'Qsim',
            label: 'Model-simulated',
            line: { color: 'blue', width: 1 },
            yAxis: 'y',
          },
          fnf: {
            sourceId: 'retro',
            column: 'FNF',
            label: 'FNF',
            line: { color: 'black', width: 1 },
            yAxis: 'y',
          },
        },
      },
    ],
  },
  {
    id: 'forecast-summary',
    label: 'Table',
    plots: [
      {
        id: 'main',
        type: 'table',
        sourceId: 'fcst',
        sources: [
          {
            id: 'fcst',
            buildUrl: buildYampaFcstUrl(),
            transformRows: ({ rows }) =>
              rows.map((row, index) => ({
                ...row,
                Date:
                  index === rows.length - 1
                    ? 'Apr-Jul'
                    : formatMonthYearLabel(row?.Date),
              })),
          },
        ],
        titleTemplate: 'Station ID: {stationId}, Name: {name}<br />Post-Processing: {postProcessing}, Forecast Update: {updateDate}',
        layout: {
          ...DEFAULT_TIMESERIES_LAYOUT,
          margin: {
            ...DEFAULT_TIMESERIES_LAYOUT.margin,
            t: 38,
          },
        },
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildYampaCsvDownloadFileName,
        },
        footerText: '[Note] 50%, 90%, 10%: exceedance levels within the forecast ensemble, calculated in two units: (1) %Avg: percentage of Avg, (2) af: acre-feet.<br>Avg: month of year average during 1979-2024.',
        columns: [
          {
            key: 'Date',
            label: 'Date',
          },
          {
            key: 'Exc50',
            label: '50% (af)',
            format: (value) => formatIntegerValue(Number.parseFloat(value) * 1000),
          },
          {
            key: 'Pav50',
            label: '50% (%Avg)',
            format: formatIntegerValue,
          },
          {
            key: 'Exc90',
            label: '90% (af)',
            format: (value) => formatIntegerValue(Number.parseFloat(value) * 1000),
          },
          {
            key: 'Pav90',
            label: '90% (%Avg)',
            format: formatIntegerValue,
          },
          {
            key: 'Exc10',
            label: '10% (af)',
            format: (value) => formatIntegerValue(Number.parseFloat(value) * 1000),
          },
          {
            key: 'Pav10',
            label: '10% (%Avg)',
            format: formatIntegerValue,
          },
          {
            key: 'Avg',
            label: 'Avg (af)',
            format: (value) => formatIntegerValue(Number.parseFloat(value) * 1000),
          },
        ],
      },
    ],
  },
]

export function getYampaPointPopupTabDefinition(tabId) {
  return YAMPA_POINT_POPUP_TABS.find((tab) => tab.id === tabId) ?? null
}

export function getDefaultYampaPointPopupTabId() {
  return YAMPA_POINT_POPUP_TABS[0]?.id ?? 'nrt-forecast'
}
