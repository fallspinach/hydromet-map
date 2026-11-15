import test from 'node:test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import { fetchAndParseCsv } from '../src/lib/csvData.js'

const csv = 'Date,PREC\n2026-11-14,0\n2026-11-15,25.4\n'
const gzip = new Uint8Array(gzipSync(csv))
const append = (body, ...bytes) => new Uint8Array([...body, ...bytes])

for (const [name, body, url] of [
  ['valid gzip', gzip, 'https://example.test/data.csv.gz'],
  ['gzip with one trailing LF', append(gzip, 10), 'https://example.test/data.csv.gz'],
  ['gzip URL with query parameters', append(gzip, 10), 'https://example.test/data.csv.gz?v=1'],
  ['plain CSV', csv, 'https://example.test/data.csv'],
]) {
  test(name, async t => {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(body))
    const result = await fetchAndParseCsv(url, { dynamicTyping: true })
    assert.deepEqual(result.fields, ['Date', 'PREC'])
    assert.deepEqual(result.rows.map(row => row.PREC), [0, 25.4])
    assert.equal(fetchMock.mock.callCount(), 1)
  })
}

const badChecksum = gzip.slice()
badChecksum[badChecksum.length - 8] ^= 1
for (const [name, body] of [
  ['other trailing garbage', append(gzip, 65)],
  ['multiple trailing newlines', append(gzip, 10, 10)],
  ['corrupted gzip plus LF', append(badChecksum, 10)],
  ['truncated gzip', gzip.slice(0, -4)],
]) {
  test(`rejects ${name}`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(body))
    await assert.rejects(fetchAndParseCsv('https://example.test/data.csv.gz'), /Failed to decode gzip CSV/)
  })
}

test('HTTP and network failures remain errors without retrying', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('missing', { status: 404 }))
  await assert.rejects(fetchAndParseCsv('https://example.test/data.csv.gz'), /404/)
  fetchMock.mock.mockImplementation(async () => { throw new TypeError('Network unavailable') })
  await assert.rejects(fetchAndParseCsv('https://example.test/data.csv.gz'), /Network unavailable/)
  assert.equal(fetchMock.mock.callCount(), 2)
})
