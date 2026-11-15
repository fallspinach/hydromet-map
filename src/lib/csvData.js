import Papa from 'papaparse'

async function decodeGzipText(blob) {
  const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(decompressedStream).text()
}

async function readResponseText(response, url) {
  if (url.split(/[?#]/, 1)[0].toLowerCase().endsWith('.gz')) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decompress .gz CSV files because DecompressionStream is unavailable.')
    }

    if (!response.body) {
      throw new Error('The gzipped CSV response body is unavailable.')
    }

    // Keep the compressed body for one retry without issuing another request.
    // Reading it outside the try block keeps network failures out of the fallback.
    const compressed = await response.blob()
    try {
      return await decodeGzipText(compressed)
    } catch (error) {
      // Temporary compatibility with the server appending a single LF to .gz
      // responses. Never trim a successfully decoded file or arbitrary bytes.
      const tail = new Uint8Array(await compressed.slice(-1).arrayBuffer())
      if (compressed.size > 1 && tail[0] === 0x0a) {
        try {
          return await decodeGzipText(compressed.slice(0, -1))
        } catch (retryError) {
          throw new Error(`Failed to decode gzip CSV from ${url}, including a retry without the trailing newline.`, { cause: retryError })
        }
      }
      throw new Error(`Failed to decode gzip CSV from ${url}.`, { cause: error })
    }
  }

  return response.text()
}

function parseCsvText(csvText, parseConfig) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      ...parseConfig,
      complete: ({ data, errors, meta }) => {
        const blockingErrors = errors.filter((error) => error.code !== 'UndetectableDelimiter')

        if (blockingErrors.length > 0) {
          reject(new Error(blockingErrors.map((error) => error.message).join('; ')))
          return
        }

        resolve({
          rows: data,
          fields: meta.fields ?? [],
          errors,
          meta,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export async function fetchAndParseCsv(url, parseConfig = {}) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`)
  }

  const csvText = await readResponseText(response, url)
  return parseCsvText(csvText, parseConfig)
}
