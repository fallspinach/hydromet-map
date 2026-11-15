// Local: start Vite with VITE_CDEC_SWE_CATALOG_URL=https://example.test/cdec-swe/catalog.json
// node tests/publicationTimeSeries.browser.mjs /path/to/publication http://127.0.0.1:5173 full
// Live full history: node tests/publicationTimeSeries.browser.mjs --live http://127.0.0.1:5173 full
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import process from 'node:process'
const [root, base = 'http://127.0.0.1:5173', profile = 'pilot'] = process.argv.slice(2)
if (!root) throw new Error('Provide a local publication directory or --live.')
const full = profile === 'full'
const pillow = 'cdecSwePublicationTest'
const course = 'cdecSnowCoursePublicationTest'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
try {
  for (const [width, timezoneId] of [[1200, 'America/Los_Angeles'], [390, 'Pacific/Honolulu']]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, timezoneId })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    if (root !== '--live') await page.route('**/cdec-swe/**', async route => {
      const file = new URL(route.request().url()).pathname.split('/cdec-swe/')[1]
      await route.fulfill({ body: await fs.readFile(path.join(root, file)), contentType: file.endsWith('.csv') ? 'text/csv' : 'application/json' })
    })
    const params = new URLSearchParams({ prj: 'cnrfcPublicationTest', bm: 'flat', ter: 'false',
      c: '-120.04166,38.710847', z: '8', lyr: `${pillow},${course}`,
      pop: `${pillow}|CAP|-120.04166|38.710847` })
    await page.goto(base + '/?' + params)
    const chart = page.locator('.publication-series-popup .js-plotly-plot')
    await chart.waitFor({ timeout: 60000 })
    await page.waitForFunction(expected => document.querySelector('.publication-series-popup .js-plotly-plot')?.data?.[0]?.x.length === expected, full ? 20772 : 731)
    assert.equal(await chart.evaluate(el => el.data[0].mode), 'lines')
    assert.equal(await chart.evaluate(el => el.data[0].x[0]), full ? '1970-01-01' : '2023-10-01')
    assert.equal(await page.getByLabel('Sensor', { exact: true }).count(), 0)
    const observation = page.getByLabel('Observation', { exact: true })
    await observation.waitFor()
    assert.ok(await observation.locator('option').count() >= 2)
    const choices = await observation.locator('option').evaluateAll(options => options.map(option => option.value))
    assert.ok(choices.includes(`${pillow}|CAP`) && choices.includes(`${course}|CAP`))
    await observation.selectOption(`${course}|CAP`)
    await page.waitForFunction(() => document.querySelector('.publication-series-popup .js-plotly-plot')?.data?.[0]?.mode === 'lines+markers')
    assert.equal(await chart.evaluate(el => el.data[0].x.filter(value => value !== null).length), full ? 447 : 12)
    assert.equal(await chart.evaluate(el => el.data[0].x[0]), full ? '1939-04-01' : '2024-01-01')
    if (!full) assert.equal(await chart.evaluate(el => el.data[0].customdata[0][0]), '2024-01-02')
    assert.ok(await chart.evaluate(el => el.data[0].y.includes(null)))
    const firstValue = await chart.evaluate(el => el.data[0].y.find(value => value !== null))
    await page.getByLabel('Units', { exact: true }).selectOption('customary')
    await page.waitForFunction(expected => Math.abs(document.querySelector('.publication-series-popup .js-plotly-plot')?.data?.[0]?.y.find(value => value !== null) - expected) < 1e-10, firstValue / 25.4)
    if (width === 1200) {
      const downloads = []
      page.on('download', download => downloads.push(download))
      await page.getByRole('button', { name: 'Download CSV files', exact: true }).click()
      await page.getByRole('button', { name: 'Download CSV files', exact: true }).waitFor()
      assert.equal(downloads.length, full ? 1 : 2)
      assert.deepEqual(downloads.map(item => item.suggestedFilename()).sort(), full ? ['CAP-swe-3-monthly-history.csv'] : ['CAP-swe-3-monthly-WY2024.csv', 'CAP-swe-3-monthly-WY2025.csv'])
      for (const download of downloads) {
        assert.equal(await download.failure(), null)
        const csv = await fs.readFile(await download.path(), 'utf8')
        assert.ok(csv.includes('swe_display_mm') && csv.split('\n')[1].startsWith('CAP,3,M,'))
      }
    }
    const box = await page.locator('.publication-series-popup').boundingBox()
    assert.ok(box.width < width && box.x >= 0 && box.x + box.width <= width)
    await page.screenshot({ path: `/tmp/cdec-swe-${width}.png` })
    await observation.selectOption(`${pillow}|CAP`)
    await page.waitForFunction(() => document.querySelector('.publication-series-popup .js-plotly-plot')?.data?.[0]?.mode === 'lines')
    assert.equal(await page.getByLabel('Units', { exact: true }).inputValue(), 'customary')
    params.set('pop', `${course}|CAP|-120.04166|38.710847`)
    params.set('tab', 'cdec:CAP:swe:3:M'); params.set('punit', 'in'); params.set('lyr', course)
    await page.goto(base + '/?' + params)
    await chart.waitFor({ timeout: 60000 })
    assert.equal(await page.getByLabel('Units', { exact: true }).inputValue(), 'customary')
    if (!full) assert.equal(await observation.count(), 0)
    else assert.ok((await observation.locator('option').evaluateAll(options => options.map(option => option.value))).every(value => value.startsWith(`${course}|`)))
    assert.equal(await chart.evaluate(el => el.data[0].mode), 'lines+markers')
    assert.deepEqual(errors, [])
    console.log(`PASS ${width}px ${timezoneId}: two layers, overlap selection, units, course markers, dates/gaps, downloads, bookmark, popup fit`)
    await context.close()
  }
} finally {
  await browser.close()
}
