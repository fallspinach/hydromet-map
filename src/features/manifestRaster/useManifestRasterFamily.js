import { useEffect, useState } from 'react'
import { buildManifestRasterFamily } from '../../lib/manifestRaster'
import { loadPublicationRaster } from '../../lib/publicationRaster'
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
        const readJson = async (href) => {
          const response = await fetchJsonNoCache(href, { signal: controller.signal })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          return response.json()
        }
        const family = definition.publicationProfile
          ? await loadPublicationRaster(definition, readJson)
          : buildManifestRasterFamily(definition, await readJson(url))
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
