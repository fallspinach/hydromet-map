import { useEffect, useState } from 'react'
import { buildManifestRasterFamily } from '../../lib/manifestRaster'
import { fetchJsonNoCache } from '../../lib/network'

export default function useManifestRasterFamily(definition) {
  const [results, setResults] = useState({})
  const [attempt, setAttempt] = useState(0)
  const url = definition?.manifestUrl
  useEffect(() => {
    if (!url) return undefined
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetchJsonNoCache(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const family = buildManifestRasterFamily(definition, await response.json())
        if (!controller.signal.aborted) setResults((current) => ({ ...current, [url]: { family } }))
      } catch (error) {
        if (!controller.signal.aborted) setResults((current) => ({ ...current, [url]: { error: error.message } }))
      }
    }
    load()
    return () => controller.abort()
  }, [url, definition, attempt])
  const result = results[url]
  return {
    family: result?.family ?? definition,
    status: !url ? null : result?.family ? 'ready' : result?.error ? 'error' : 'loading',
    retry: () => {
      setResults((current) => ({ ...current, [url]: undefined }))
      setAttempt((value) => value + 1)
    },
  }
}
