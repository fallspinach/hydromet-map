import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadPublicationRaster } from '../src/lib/publicationRaster.js'
import { normalizeManifestSelection } from '../src/lib/manifestRaster.js'

const definition = { manifestUrl: 'https://example.org/cnrfc/family.json', raster: {} }
function fixture() {
  const asset = (id, variable, date, resolution = 'daily') => ({
    id, variable, date, resolution, product: 'forcing', stream: 'nrt',
    href: `images/${id}.png`, mediaType: 'image/png', encoding: 'precolored-rgba',
    legendId: 'rain', visiblePixels: 0,
  })
  const assets = [asset('a', 'rain', '2026-10-01'), asset('b', 'rain', '2026-10-03'), asset('c', 'rank', '2026-10-01', 'monthly')]
  return {
    'family.json': { convention: 'hydro-ops-raster-pilot', conventionVersion: '0.4', pixelProjection: 'EPSG:3857',
      placement: { cornerOrder: ['top-left', 'top-right', 'bottom-right', 'bottom-left'], pixelReference: 'outer-edges', rowOrder: 'north-to-south', corners: [[-120,40],[-110,40],[-110,30],[-120,30]] },
      variables: '../variables.json', legends: '../legends.json', availability: 'availability.json', timeline: 'timeline.json' },
    'variables.json': { variables: { rain: { label: 'Daily rain' }, rank: { label: 'Monthly rank' } } },
    'legends.json': { rain: { type: 'discrete', thresholdUnit: '1', displayUnitLabel: '%', bins: [{ upper: 2.5, color: '#00000000' }, { upper: null, color: '#ff0000ff' }] } },
    'availability.json': { assets },
    'timeline.json': { entries: assets.map(a => ({ ...a, preferredAsset: a.id, availableAssets: [a.id] })) },
  }
}
const load = data => loadPublicationRaster(definition, async url => data[new URL(url).pathname.split('/').at(-1)])
test('publication preserves transparent images, exact palette and relative asset paths', async () => {
  const family = await load(fixture())
  const rain = family.raster.variables.rain
  assert.equal(rain.units, '%')
  assert.deepEqual(rain.availableDates, ['2026-10-01', '2026-10-03'])
  assert.equal(rain.buildRasterUrl({ date: '2026-10-03' }), 'https://example.org/cnrfc/images/b.png')
  assert.equal(rain.buildRasterUrl({ date: '2026-10-02' }), null)
  assert.deepEqual(rain.palette, { colors: ['#00000000', '#ff0000ff'], thresholds: ['2.5'] })
  assert.equal(normalizeManifestSelection({ variable: 'rain', date: '2026-10-02' }, family).date, '2026-10-01')
  assert.equal(normalizeManifestSelection({ variable: 'rank', date: '2026-10-03' }, family).date, '2026-10-01')
})
test('publication rejects unresolved preferred assets and ambiguous series', async () => {
  const data = fixture()
  data['timeline.json'].entries[0].preferredAsset = 'missing'
  await assert.rejects(load(data), /preferred asset/)
  const ambiguous = fixture()
  ambiguous['availability.json'].assets[1].product = 'other'
  ambiguous['timeline.json'].entries[1].product = 'other'
  await assert.rejects(load(ambiguous), /Ambiguous/)
})

test('calendar navigation clamps month ends and range boundaries and skips gaps', async () => {
  const { stepPublicationDate } = await import('../src/lib/publicationRaster.js')
  const dates = ['2026-01-31', '2026-02-28', '2026-03-01', '2026-03-31']
  assert.equal(stepPublicationDate('2026-01-31', dates, 1, 'month'), '2026-02-28')
  assert.equal(stepPublicationDate('2026-03-31', dates, -1, 'month'), '2026-02-28')
  assert.equal(stepPublicationDate('2026-02-28', dates, 1, 'day'), '2026-03-01')
  assert.equal(stepPublicationDate('2026-03-01', dates, 1, 'day'), '2026-03-31')
  assert.equal(stepPublicationDate('2026-01-31', dates, -1, 'month'), '2026-01-31')
  assert.equal(stepPublicationDate('2026-03-31', dates, 1, 'month'), '2026-03-31')
})
