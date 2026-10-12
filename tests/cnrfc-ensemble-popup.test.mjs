import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { gzipSync } from 'node:zlib'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())
const config = await server.ssrLoadModule('/src/features/cnrfcPointPopup/cnrfcPointPopupConfig.js')
const data = await server.ssrLoadModule('/src/features/cnrfcPointPopup/cnrfcPointPopupData.js')
const { WWRF_ENSEMBLE_MEMBERS: members } = await server.ssrLoadModule('/src/config/mapConfig.js')
const csv = ['Date,' + members.map(m => `RUNOFF_${m}`).join(','),
  '2026-10-11,' + members.map((_, i) => i / 10).join(','),
  '2026-10-12,' + members.map((_, i) => i === 0 ? '' : i / 20).join(',')].join('\n')
const response = () => new Response(gzipSync(csv))
const nrtResponse = () => new Response(gzipSync('Date,T2D,PREC,RUNOFF,SWE,SMTOT\n2026-10-10,15,2,0.3,10,0.25'))
function station(product = 'wwrf-ens') {
  return { id: 'MBRC1', name: 'Test basin', popup: { ...data.createInitialCnrfcPointPopupState(), forecastProduct: product, statusTimestamp: '2026-10-10T12:00' } }
}

test('ensemble offers daily NRT plus forecast RUNOFF while deterministic products retain all tabs', () => {
  assert.deepEqual(data.getCnrfcPointPopupTabs('wwrf-ens').map(t => t.id), ['daily'])
  assert.deepEqual(data.getCnrfcPointPopupTabs('gfs').map(t => t.id), ['hourly', 'daily', 'monthly'])
  assert.equal(Object.keys(config.getCnrfcPointPopupTabDefinition('daily', 'wwrf-ens').plots[0].series).length, 205)
})

test('daily ensemble combines five NRT variables and 200 members with only NRT legend entries', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async url => { requests.push(url); return url.includes('/nrt/') ? nrtResponse() : response() }
  try {
    let current = station()
    current.popup.activeTabId = 'hourly'
    await data.loadCnrfcPointPopupTabData(updater => { current = updater(current) }, current, 'hourly')
    const plot = current.popup.tabDataById.daily.plotsById.main
    assert.equal(current.popup.activeTabId, 'daily')
    assert.equal(plot.status, 'ready')
    assert.equal(plot.traces.length, 205)
    const ensemble = plot.traces.slice(5)
    assert.ok(ensemble.every(trace => trace.showlegend === false && trace.yaxis === 'y3'))
    assert.ok(plot.traces.slice(0, 5).every(trace => trace.showlegend !== false))
    assert.deepEqual(plot.traces.slice(0, 5).map(trace => trace.yaxis ?? 'y'), ['y', 'y2', 'y3', 'y4', 'y5'])
    assert.equal(plot.traces[4].y[0], 250)
    assert.equal(plot.traces[1].type, 'bar')
    assert.equal(plot.layout.showlegend, true)
    assert.equal(plot.hovermode, 'closest')
    assert.equal(ensemble[0].name, 'ecm000')
    assert.equal(ensemble[199].name, 'gefs079')
    assert.deepEqual(ensemble[0].y, [0, null])
    assert.deepEqual(ensemble[199].y, [19.9, 9.95])
    assert.match(ensemble[199].hovertemplate, /gefs079/)
    assert.equal(plot.yAxesLayout.yaxis3.title.text, 'Local Runoff (m³/s)')
    assert.deepEqual(plot.xAxisLayout, config.getCnrfcPointPopupTabDefinition('daily', 'gfs').plots[0].xAxis({ popupState: current.popup }))
    assert.equal(plot.downloadFiles.length, 2)
    assert.deepEqual(requests, ['https://cw3e.ucsd.edu/hydro/cnrfc/csv/basins/nrt/daily/MBRC1_daily.csv.gz', 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/basins/fcst/wwrf_ens/daily/MBRC1_daily.csv.gz'])
  } finally { globalThis.fetch = originalFetch }
})

test('late ensemble responses cannot overwrite a different forecast product', async () => {
  const originalFetch = globalThis.fetch
  let resolveFetch
  globalThis.fetch = url => url.includes('/nrt/') ? Promise.resolve(nrtResponse()) : new Promise(resolve => { resolveFetch = resolve })
  try {
    let current = station()
    const set = updater => { current = updater(current) }
    const pending = data.loadCnrfcPointPopupTabData(set, current, 'daily')
    data.setCnrfcPointPopupForecastProduct(set, 'gfs')
    resolveFetch(response())
    await pending
    assert.equal(current.popup.forecastProduct, 'gfs')
    assert.equal(current.popup.tabDataById.daily.plotsById.main.status, 'idle')
  } finally { globalThis.fetch = originalFetch }
})

test('unavailable ensemble files display a recoverable plot error', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('', { status: 404 })
  try {
    let current = station()
    await data.loadCnrfcPointPopupTabData(updater => { current = updater(current) }, current, 'daily')
    assert.equal(current.popup.tabDataById.daily.plotsById.main.status, 'error')
    assert.match(current.popup.tabDataById.daily.plotsById.main.error, /404/)
  } finally { globalThis.fetch = originalFetch }
})

test('negative precipitation is zeroed in all point-popup tabs without changing temperature or missing values', async () => {
  const originalFetch = globalThis.fetch
  const sample = [
    'Date,T2D,PREC,RUNOFF,SWE,SMTOT',
    '2024-01-01,-5,-999000000,1,0,0.2',
    '2024-01-02,-2,-0.1,1,0,0.2',
    '2024-01-03,0,0,1,0,0.2',
    '2024-01-04,2,3.5,1,0,0.2',
    '2024-01-05,3,,1,0,0.2',
  ].join('\n')
  globalThis.fetch = async () => new Response(gzipSync(sample))
  try {
    for (const [product, tab] of [['gfs', 'hourly'], ['gfs', 'daily'], ['gfs', 'monthly'], ['wwrf-ens', 'daily']]) {
      let current = station(product)
      await data.loadCnrfcPointPopupTabData(updater => { current = updater(current) }, current, tab)
      const plot = current.popup.tabDataById[tab].plotsById.main
      assert.equal(plot.status, 'ready')
      const precipitation = plot.traces.filter(trace => trace.yaxis === 'y2')
      assert.equal(precipitation.length, product === 'gfs' && tab !== 'monthly' ? 2 : 1)
      for (const trace of precipitation) assert.deepEqual(trace.y, [0, 0, 0, 3.5, null])
      for (const trace of plot.traces.filter(trace => !trace.yaxis)) {
        assert.deepEqual(trace.y, [-5, -2, 0, 2, 3])
      }
    }
  } finally { globalThis.fetch = originalFetch }
})

test('hourly NRT retains current and previous water years across the October boundary', async () => {
  const originalFetch = globalThis.fetch
  try {
    for (const [latest, cutoff] of [['2026-09-30 23:00:00', '2024-10-01 00:00:00'], ['2026-10-01 00:00:00', '2025-10-01 00:00:00']]) {
      // Unsorted rows ensure the cutoff uses the latest data date, not the final row.
      const dates = [latest, '2024-09-30 23:00:00', '2024-10-01 00:00:00', '2025-09-30 23:00:00', '2025-10-01 00:00:00', '2020-01-01 00:00:00']
      const makeCsv = values => 'Date,T2D,PREC,RUNOFF\n' + values.map(date => `${date},10,1,2`).join('\n')
      globalThis.fetch = async url => new Response(gzipSync(makeCsv(url.includes('/nrt/') ? dates : ['2026-10-02 00:00:00'])))
      let current = station('gfs')
      await data.loadCnrfcPointPopupTabData(updater => { current = updater(current) }, current, 'hourly')
      const plot = current.popup.tabDataById.hourly.plotsById.main
      assert.equal(plot.status, 'ready')
      for (const trace of plot.traces.slice(0, 3)) assert.deepEqual(trace.x, dates.filter(date => date >= cutoff))
      for (const trace of plot.traces.slice(3)) assert.deepEqual(trace.x, ['2026-10-02 00:00:00'])
      assert.equal(plot.downloadFiles.length, 2)
      current = station('gfs')
      await data.loadCnrfcPointPopupTabData(updater => { current = updater(current) }, current, 'daily')
      assert.deepEqual(current.popup.tabDataById.daily.plotsById.main.traces[0].x, dates)
    }
  } finally { globalThis.fetch = originalFetch }
})
