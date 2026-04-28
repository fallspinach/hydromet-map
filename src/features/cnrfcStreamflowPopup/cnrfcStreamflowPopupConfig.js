import {
  CLIMATOLOGY_COLUMN_NAMES,
  fetchCnrfcBinaryDescriptor,
} from '../../lib/cnrfcBinaryData'
import { buildCsvDownloadFileName } from '../../lib/csvExport'
import {
  DEFAULT_TIMESERIES_LAYOUT,
  DEFAULT_TIMESERIES_PLOTLY_CONFIG,
} from '../cnrfcPointPopup/cnrfcPointPopupConfig'

export const CNRFC_STREAMFLOW_POPUP_WIDTH = '1100px'
const CNRFC_STREAMFLOW_TIMESERIES_LAYOUT = {
  ...DEFAULT_TIMESERIES_LAYOUT,
  title: {
    font: {
      size: 14,
    },
  },
}

const CLIMATOLOGY_LINE_COLORS = [
  'mediumpurple',
  'lightblue',
  'lightcyan',
  'lightgreen',
  'yellow',
  'orange',
  'sienna',
]

const CLIMATOLOGY_FILL_COLORS = [
  'mediumpurple',
  'lightblue',
  'lightcyan',
  'lightgreen',
  'yellow',
  'orange',
  'white',
]

const CLIMATOLOGY_SERIES_DEFINITIONS = {
  p95: {
    sourceId: 'climatology',
    column: 'Pctl95',
    label: '95<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[0], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[0]}22`,
    yAxis: 'y',
  },
  p90: {
    sourceId: 'climatology',
    column: 'Pctl90',
    label: '90<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[1], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[1]}22`,
    yAxis: 'y',
  },
  p80: {
    sourceId: 'climatology',
    column: 'Pctl80',
    label: '80<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[2], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[2]}22`,
    yAxis: 'y',
  },
  p50: {
    sourceId: 'climatology',
    column: 'Pctl50',
    label: '50<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[3], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[3]}22`,
    yAxis: 'y',
  },
  p20: {
    sourceId: 'climatology',
    column: 'Pctl20',
    label: '20<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[4], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[4]}22`,
    yAxis: 'y',
  },
  p10: {
    sourceId: 'climatology',
    column: 'Pctl10',
    label: '10<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[5], width: 1 },
    fill: 'tozeroy',
    fillcolor: `${CLIMATOLOGY_FILL_COLORS[5]}22`,
    yAxis: 'y',
  },
  p5: {
    sourceId: 'climatology',
    column: 'Pctl5',
    label: '5<sup>th</sup>',
    line: { color: CLIMATOLOGY_LINE_COLORS[6], width: 1 },
    fill: 'tozeroy',
    fillcolor: CLIMATOLOGY_FILL_COLORS[6],
    yAxis: 'y',
  },
}

function parseIsoDateUtc(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText ?? '')) {
    return null
  }

  const parsedDate = new Date(`${dateText}T00:00:00Z`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function formatIsoDateUtc(date) {
  return date.toISOString().slice(0, 10)
}

async function resolveDescriptorEndDate(product = 'nrt') {
  const descriptor = await fetchCnrfcBinaryDescriptor(product)
  return descriptor?.end ?? null
}

function resolveWaterYearStartDateText(endDateText) {
  const endDate = parseIsoDateUtc(endDateText)

  if (!endDate) {
    return null
  }

  const waterYearStartYear = endDate.getUTCMonth() >= 9
    ? endDate.getUTCFullYear()
    : endDate.getUTCFullYear() - 1

  return formatIsoDateUtc(new Date(Date.UTC(waterYearStartYear, 9, 1)))
}

function resolveWaterYearEndDateText(referenceDateText) {
  const referenceDate = parseIsoDateUtc(referenceDateText)

  if (!referenceDate) {
    return null
  }

  const waterYearEndYear = referenceDate.getUTCMonth() >= 9
    ? referenceDate.getUTCFullYear() + 1
    : referenceDate.getUTCFullYear()

  return formatIsoDateUtc(new Date(Date.UTC(waterYearEndYear, 8, 30)))
}

function trimRowsToDateRange({ rows, startDateText, endDateText = null }) {
  if (!startDateText) {
    return rows
  }

  return rows.filter((row) => {
    const dateText = row?.Date

    if (typeof dateText !== 'string') {
      return false
    }

    if (dateText < startDateText) {
      return false
    }

    if (endDateText && dateText > endDateText) {
      return false
    }

    return true
  })
}

function buildCnrfcStreamflowPopupRecentSources({ station }) {
  return [
    {
      id: 'nrt',
      loader: 'cnrfcSeries',
      buildRequest: () => ({
        product: 'nrt',
        idx: station.idx,
        valueColumn: 'Flow',
      }),
      transformRows: ({ rows, sourceRecord }) =>
        trimRowsToDateRange({
          rows,
          startDateText: resolveWaterYearStartDateText(sourceRecord.metadata?.end),
          endDateText: sourceRecord.metadata?.end,
        }),
    },
    {
      id: 'wwrf_ecmwf',
      loader: 'cnrfcSeries',
      buildRequest: () => ({
        product: 'wwrf_ecmwf',
        idx: station.idx,
        valueColumn: 'Flow',
      }),
      transformRows: ({ rows, sourceRecord }) =>
        trimRowsToDateRange({
          rows,
          startDateText: resolveWaterYearStartDateText(sourceRecord.metadata?.end),
          endDateText: sourceRecord.metadata?.end,
        }),
    },
    {
      id: 'wwrf_gfs',
      loader: 'cnrfcSeries',
      buildRequest: () => ({
        product: 'wwrf_gfs',
        idx: station.idx,
        valueColumn: 'Flow',
      }),
      transformRows: ({ rows, sourceRecord }) =>
        trimRowsToDateRange({
          rows,
          startDateText: resolveWaterYearStartDateText(sourceRecord.metadata?.end),
          endDateText: sourceRecord.metadata?.end,
        }),
    },
    {
      id: 'gfs',
      loader: 'cnrfcSeries',
      buildRequest: () => ({
        product: 'gfs',
        idx: station.idx,
        valueColumn: 'Flow',
      }),
      transformRows: ({ rows, sourceRecord }) =>
        trimRowsToDateRange({
          rows,
          startDateText: resolveWaterYearStartDateText(sourceRecord.metadata?.end),
          endDateText: sourceRecord.metadata?.end,
        }),
    },
    {
      id: 'climatology',
      loader: 'cnrfcPercentiles',
      buildRequest: async () => {
        const descriptorEndDateText = await resolveDescriptorEndDate('nrt')
        const waterYearStartDateText = resolveWaterYearStartDateText(descriptorEndDateText)
        const waterYearEndDateText = resolveWaterYearEndDateText(descriptorEndDateText)
        const endDate = parseIsoDateUtc(waterYearEndDateText)
        const startDate = parseIsoDateUtc(waterYearStartDateText)
        const dayCount =
          endDate && startDate
            ? Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1
            : 366

        return {
          idx: station.idx,
          endDateText: waterYearEndDateText,
          dayCount,
          columnNames: CLIMATOLOGY_COLUMN_NAMES,
          descriptorProduct: 'nrt',
        }
      },
    },
  ]
}

function buildCnrfcStreamflowPopupRecentSeries() {
  return {
    ...CLIMATOLOGY_SERIES_DEFINITIONS,
    wwrfEcmwf: {
      sourceId: 'wwrf_ecmwf',
      column: 'Flow',
      label: 'WWRF-ECMWF',
      line: { color: 'blue', width: 1.5, dash: 'dash' },
      yAxis: 'y',
    },
    wwrfGfs: {
      sourceId: 'wwrf_gfs',
      column: 'Flow',
      label: 'WWRF-GFS',
      line: { color: 'cyan', width: 1.5, dash: 'dash' },
      yAxis: 'y',
    },
    gfs: {
      sourceId: 'gfs',
      column: 'Flow',
      label: 'GFS',
      line: { color: 'magenta', width: 1.5, dash: 'dash' },
      yAxis: 'y',
    },
    nrt: {
      sourceId: 'nrt',
      column: 'Flow',
      label: 'NRT',
      line: { color: 'darkblue', width: 1.5 },
      yAxis: 'y',
    },
  }
}

function buildCnrfcStreamflowPopupHistorySources({ station }) {
  return [
    {
      id: 'retro',
      loader: 'cnrfcSeries',
      buildRequest: () => ({
        product: 'retro',
        idx: station.idx,
        valueColumn: 'Flow',
      }),
    },
  ]
}

function buildCnrfcStreamflowPopupHistorySeries() {
  return {
    retro: {
      sourceId: 'retro',
      column: 'Flow',
      label: 'Retrospective',
      line: { color: 'darkblue', width: 1.5 },
      yAxis: 'y',
    },
  }
}

function buildCnrfcStreamflowPopupCsvDownloadFileName(context) {
  const station = context.station ?? {}

  return buildCsvDownloadFileName({
    prefix: 'streamflow',
    stationId: station.featureId ?? station.id ?? 'river',
    sourceId: context.sourceId,
    defaultFileName: context.defaultFileName,
    extraParts: [],
  })
}

function buildCnrfcStreamflowPopupTitle(station) {
  const titleParts = [
    `WRF-Hydro (NWM 3.0) Natural Flow (UNCORRECTED!), River ID: ${station.featureId ?? station.id}`,
  ]

  if (station.name && station.name !== 'Unnamed') {
    titleParts.push(`Name: ${station.name}`)
  }

  if (Number.isFinite(station.lengthKm)) {
    titleParts.push(`Length: ${station.lengthKm.toFixed(1)} km`)
  }

  if (Number.isFinite(station.streamOrder)) {
    titleParts.push(`Order: ${station.streamOrder}`)
  }

  return titleParts.join(', ')
}

export const CNRFC_STREAMFLOW_POPUP_TABS = [
  {
    id: 'recent',
    label: 'NRT/Forecast',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: buildCnrfcStreamflowPopupRecentSources,
        hovermode: 'x unified',
        titleText: ({ station }) => buildCnrfcStreamflowPopupTitle(station),
        layout: CNRFC_STREAMFLOW_TIMESERIES_LAYOUT,
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildCnrfcStreamflowPopupCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Flow (m<sup>3</sup>/s)', standoff: 0 },
            zeroline: false,
          },
        },
        series: buildCnrfcStreamflowPopupRecentSeries,
      },
    ],
  },
  {
    id: 'history',
    label: 'Retrospective',
    plots: [
      {
        id: 'main',
        type: 'timeseries',
        sources: buildCnrfcStreamflowPopupHistorySources,
        hovermode: 'x unified',
        titleText: ({ station }) => buildCnrfcStreamflowPopupTitle(station),
        layout: CNRFC_STREAMFLOW_TIMESERIES_LAYOUT,
        plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG,
        csvDownload: {
          enabled: true,
          fileName: buildCnrfcStreamflowPopupCsvDownloadFileName,
        },
        axes: {
          y: {
            title: { text: 'Flow (m<sup>3</sup>/s)', standoff: 0 },
            zeroline: false,
          },
        },
        series: buildCnrfcStreamflowPopupHistorySeries,
      },
    ],
  },
]

export function getCnrfcStreamflowPopupTabDefinition(tabId) {
  return CNRFC_STREAMFLOW_POPUP_TABS.find((tab) => tab.id === tabId) ?? null
}

export function getDefaultCnrfcStreamflowPopupTabId() {
  return CNRFC_STREAMFLOW_POPUP_TABS[0]?.id ?? 'recent'
}
