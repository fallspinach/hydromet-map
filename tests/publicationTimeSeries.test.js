import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePublishedRows, publishedSwePlot } from '../src/lib/publicationTimeSeries.js'

const series = { id: 'test', featureId: '001', variable: 'swe', label: 'SWE' }
const collection = {
  variables: { swe: { authoritativePlotColumn: 'value', qualityColumn: 'status', validRange: { minimum: 0, includeMinimum: true } } },
  seriesKeyBindings: { station: { column: 'station', matchesSeriesField: 'featureId' } },
  csv: { recordKey: ['station', 'time'], missingTokens: [''] },
  time: { plotColumn: 'time' },
  quality: { displayStatusDictionary: { retained: { exclude: false }, missing: { exclude: true } } },
}
function row(value, day, status = 'retained') {
  return { station: '001', time: `2024-02-${day}T00:00:00-08:00`, value, status }
}
test('reporting dates, valid zero, missing and negative values survive conversion correctly', () => {
  const rows = normalizePublishedRows([row('25.4', '29'), row('0', '26'), row('', '27', 'missing'), row('-1', '28')], collection, series)
  assert.deepEqual(rows.map(item => item.date), ['2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29'])
  assert.deepEqual(publishedSwePlot(rows, series, 'in').traces[0].y, [0, null, null, 1])
  assert.equal(publishedSwePlot(rows, series, 'mm').traces[0].connectgaps, false)
})
test('unknown status, duplicate records, incorrect station and malformed numbers fail visibly', () => {
  assert.throws(() => normalizePublishedRows([row('1', '29', 'unknown')], collection, series), /Unknown/)
  assert.throws(() => normalizePublishedRows([row('1', '29'), row('2', '29')], collection, series), /Duplicate/)
  assert.throws(() => normalizePublishedRows([{ ...row('1', '29'), station: '002' }], collection, series), /series/)
  assert.throws(() => normalizePublishedRows([row('oops', '29')], collection, series), /numeric/)
})

test('canonical range metadata respects inclusive/exclusive bounds', () => {
  const c = structuredClone(collection)
  c.variables.swe.validRange = { minimum: 0, includeMinimum: false, maximum: 25.4, includeMaximum: false }
  const rows = normalizePublishedRows([row('0', '26'), row('12', '27'), row('25.4', '28'), row('26', '29')], c, series)
  assert.deepEqual(rows.map(item => item.value), [null, 12, null, null])
})
test('monthly surveys use markers and retain observation dates without changing reporting dates', () => {
  const c = structuredClone(collection)
  c.time.observationTimeColumn = 'observed'
  const rows = normalizePublishedRows([{ ...row('25.4', '01'), observed: '2024-01-27T00:00:00-08:00' }], c, series)
  const trace = publishedSwePlot(rows, { ...series, resolution: 'monthly' }, 'in').traces[0]
  assert.equal(trace.mode, 'lines+markers')
  assert.deepEqual(trace.x, ['2024-02-01'])
  assert.equal(trace.customdata[0][0], '2024-01-27')
  assert.deepEqual(trace.y, [1])
})

test('course lines join consecutive reporting months but break for absent months and missing values', () => {
  const dates = ['2023-12-01', '2024-01-01', '2024-02-01', '2024-03-01', '2024-05-01', '2025-01-01', '2025-02-01']
  const rows = dates.map((date, i) => ({ date, value: i === 2 ? null : 25.4 }))
  const trace = publishedSwePlot(rows, { ...series, resolution: 'monthly' }, 'in').traces[0]
  assert.deepEqual(trace.x, [dates[0], dates[1], dates[2], dates[3], null, dates[4], null, dates[5], dates[6]])
  assert.deepEqual(trace.y, [1, 1, null, 1, null, 1, null, 1, 1])
  assert.equal(trace.connectgaps, false)
  assert.deepEqual(publishedSwePlot(rows, { ...series, resolution: 'daily' }, 'mm').traces[0].x, dates)
})
