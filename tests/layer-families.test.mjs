import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import { getFamilyState, setFamilyState, toggleProjectLayer } from '../src/lib/projectFamilies.js'
import { buildManifestRasterFamily, normalizeManifestSelection } from '../src/lib/manifestRaster.js'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())
const config = await server.ssrLoadModule('/src/config/mapConfig.js')
const bookmarks = await server.ssrLoadModule('/src/lib/appState.js')
const { PROJECTS, LAYER_FAMILIES, createProjectState, createDefaultAppState } = config
const project = PROJECTS.ocwd
function read(search) {
  globalThis.window = { location: { search, origin: 'http://localhost:5173', pathname: '/' } }
  return bookmarks.readStateFromUrl()
}
function toggle(state, id) { return toggleProjectLayer(state, project, LAYER_FAMILIES, id) }

test('OCWD defaults to Landsat without changing other project defaults', () => {
  const state = createProjectState('ocwd')
  assert.equal(state.activeFamilyId, 'ocwdLandsat8')
  assert.equal(state.layers.ocwdLandsat8Raster, true)
  assert.equal(state.layers.cnrfcRaster, false)
  assert.equal(state.layers.ocwdWells, true)
  assert.equal(read('?prj=ocwd').projectStateById.ocwd.activeFamilyId, 'ocwdLandsat8')
  assert.equal(createProjectState('cnrfc').layers.cnrfcRaster, true)
  assert.equal(createProjectState('arRecon').layers.arRecon3d, true)
})

test('switching families disables dependent layers, restores them, and preserves selections', () => {
  let state = toggle(createProjectState('ocwd'), 'cnrfcRaster')
  state = toggle(state, 'cnrfcStreamflow')
  state = setFamilyState(state, project, 'cnrfc', { ...state.family, date: '2026-01-05' })
  state = toggle(state, 'ocwdLandsat8Raster')
  assert.equal(state.layers.cnrfcRaster, false)
  assert.equal(state.layers.cnrfcStreamflow, false)
  assert.equal(state.layers.ocwdWells, true)
  assert.equal(state.layers.cnrfcRivers, true)
  assert.equal(getFamilyState(state, project, 'cnrfc').date, '2026-01-05')
  state = toggle(state, 'cnrfcStreamflow')
  assert.equal(state.activeFamilyId, 'cnrfc')
  assert.equal(state.layers.cnrfcRaster, true)
  assert.equal(state.layers.cnrfcStreamflow, true)
  assert.equal(state.layers.ocwdLandsat8Raster, false)
  state = toggle(state, 'cnrfcRaster')
  assert.equal(state.layers.cnrfcStreamflow, true)
})

test('explicitly disabled sibling layers are not resurrected later', () => {
  let state = toggle(createProjectState('ocwd'), 'cnrfcRaster')
  state = toggle(state, 'cnrfcStreamflow')
  state = toggle(state, 'ocwdLandsat8Raster')
  state = toggle(state, 'cnrfcRaster')
  state = toggle(state, 'cnrfcStreamflow')
  state = toggle(state, 'cnrfcRaster')
  state = toggle(state, 'ocwdLandsat8Raster')
  state = toggle(state, 'cnrfcRaster')
  assert.equal(state.layers.cnrfcStreamflow, false)
})

test('legacy bookmarks select CNRFC and keep date and variable', () => {
  const state = read('?prj=ocwd&var=sweDaily&d=2024-01-01&lyr=cnrfcRaster,cnrfcStreamflow,ocwdWells').projectStateById.ocwd
  assert.equal(state.activeFamilyId, 'cnrfc')
  assert.equal(state.family.variable, 'sweDaily')
  assert.equal(state.family.date, '2024-01-01')
  assert.equal(state.layers.ocwdLandsat8Raster, false)
  assert.equal(state.layers.cnrfcStreamflow, true)
})

test('Landsat bookmarks round-trip and normalize conflicting visibility', () => {
  const app = read('?prj=ocwd&fam=ocwdLandsat8&var=ndvi&d=2023-08-05&lyr=ocwdLandsat8Raster,cnrfcRaster,cnrfcStreamflow,ocwdWells')
  const state = app.projectStateById.ocwd
  assert.equal(state.layers.cnrfcRaster, false)
  assert.equal(state.layers.cnrfcStreamflow, false)
  assert.equal(getFamilyState(state, project, 'ocwdLandsat8').date, '2023-08-05')
  const url = new URL(bookmarks.writeStateToUrl(app))
  const restored = read(url.search).projectStateById.ocwd
  assert.equal(restored.activeFamilyId, 'ocwdLandsat8')
  assert.equal(getFamilyState(restored, project, 'ocwdLandsat8').variable, 'ndvi')
  assert.equal(restored.family.variable, 'precipitationDaily')
  assert.equal(restored.layers.ocwdWells, true)
  assert.equal(url.searchParams.has('prod'), false)
})

test('all-off bookmarks remain all off and omit hidden family selections', () => {
  const app = read('?prj=ocwd&lyr=')
  assert.equal(Object.values(app.projectStateById.ocwd.layers).some(Boolean), false)
  const url = new URL(bookmarks.writeStateToUrl(app))
  assert.equal(url.searchParams.has('fam'), false)
  assert.equal(url.searchParams.has('var'), false)
  assert.equal(Object.values(read(url.search).projectStateById.ocwd.layers).some(Boolean), false)
})

test('AR Recon custom family fields survive bookmark round-trip', () => {
  const app = read('?prj=arRecon&ary=2025&arf=flight-a,flight-b&arx=30&ara=false&gid=2025-12-12&fh=12&lyr=arRecon3d,gfsIvtParticles')
  const restored = read(new URL(bookmarks.writeStateToUrl(app)).search)
  assert.deepEqual(restored.projectStateById.arRecon.family, app.projectStateById.arRecon.family)
})

const manifest = {
  crs: 'EPSG:3857', maplibre_coordinates_lon_lat: [[-118, 34], [-117, 34], [-117, 33], [-118, 33]],
  color_scale: { cmap: 'BrBG', vmin: -1, vmax: 1, legend: 'legend.png' }, resampling: 'nearest',
  images: [
    { index: 'NDMI', date: '2026-01-01', file: 'first.png', valid_pixels: 1 },
    { index: 'NDMI', date: '2026-01-05', file: 'empty.png', valid_pixels: 0 },
    { index: 'NDMI', date: '2026-01-10', file: 'last.png', valid_pixels: 2 },
    { index: 'NDVI', date: '2026-01-03', file: 'ndvi.png', valid_pixels: 3 },
  ],
}

test('manifest filters empty observations and uses published URLs/coordinates/legend', () => {
  const family = buildManifestRasterFamily(LAYER_FAMILIES.ocwdLandsat8, manifest)
  const variable = family.raster.variables.ndmi
  assert.deepEqual(variable.availableDates, ['2026-01-01', '2026-01-10'])
  assert.equal(variable.buildRasterUrl({ date: '2026-01-05' }), null)
  assert.equal(variable.buildRasterUrl({ date: '2026-01-01' }).endsWith('/first.png'), true)
  assert.deepEqual(variable.coordinates, manifest.maplibre_coordinates_lon_lat)
  assert.equal(variable.palette.colors.length, 10)
  assert.deepEqual(variable.palette.thresholds, ['-1', '-0.8', '-0.6', '-0.4', '-0.2', '0', '0.2', '0.4', '0.6', '0.8', '1'])
  assert.equal(variable.palette.imageUrl, undefined)
  assert.equal(normalizeManifestSelection({ variable: 'ndmi', date: '' }, family).date, '2026-01-10')
  assert.equal(normalizeManifestSelection({ variable: 'ndmi', date: '2026-01-05' }, family).date, '2026-01-01')
  assert.equal(normalizeManifestSelection({ variable: 'ndvi', date: '2026-01-10' }, family).date, '2026-01-03')
})

test('invalid or entirely empty manifests produce a recoverable loading error', () => {
  assert.throws(() => buildManifestRasterFamily(LAYER_FAMILIES.ocwdLandsat8, { ...manifest, images: [] }))
  assert.throws(() => buildManifestRasterFamily(LAYER_FAMILIES.ocwdLandsat8, { ...manifest, maplibre_coordinates_lon_lat: [] }))
})

test('family state edits do not leak across projects', () => {
  const app = createDefaultAppState()
  app.projectStateById.ocwd = setFamilyState(app.projectStateById.ocwd, project, 'cnrfc', { variable: 'sweDaily' })
  assert.equal(app.projectStateById.cnrfc.family.variable, 'soilMoistureDaily')
})
