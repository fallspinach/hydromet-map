import { buildNoCacheUrl } from './network'

function sanitizeFilenamePart(value) {
  return String(value ?? '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-+|-+$/g, '')
}

function getFileNameFromUrl(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return ''
  }

  try {
    const parsedUrl = new URL(url)
    const pathnameSegments = parsedUrl.pathname.split('/').filter(Boolean)
    return pathnameSegments[pathnameSegments.length - 1] ?? ''
  } catch {
    const [pathWithoutQuery] = url.split('?')
    const pathnameSegments = pathWithoutQuery.split('/').filter(Boolean)
    return pathnameSegments[pathnameSegments.length - 1] ?? ''
  }
}

function getFileExtension(fileName) {
  if (typeof fileName !== 'string') {
    return '.csv'
  }

  if (fileName.endsWith('.csv.gz')) {
    return '.csv.gz'
  }

  const extensionMatch = fileName.match(/(\.[A-Za-z0-9]+)$/)
  return extensionMatch?.[1] ?? '.csv'
}

function replaceGzipExtension(fileName) {
  if (typeof fileName !== 'string' || !fileName.endsWith('.csv.gz')) {
    return fileName
  }

  return fileName.slice(0, -3)
}

function joinFileNameParts(parts) {
  return parts
    .map((part) => sanitizeFilenamePart(part))
    .filter(Boolean)
    .join('_')
}

function resolveDownloadFileName({
  csvDownload,
  station,
  popupState,
  plotDefinition,
  plotState,
  sourceId,
  sourceUrl,
  exportType,
  defaultFileName,
}) {
  const configuredFileName =
    typeof csvDownload?.fileName === 'function'
      ? csvDownload.fileName({
          station,
          popupState,
          plotDefinition,
          plotState,
          sourceId,
          sourceUrl,
          exportType,
          defaultFileName,
        })
      : null

  if (typeof configuredFileName === 'string' && configuredFileName.trim()) {
    const extension = getFileExtension(defaultFileName)
    const sanitizedConfiguredName = configuredFileName
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')

    return sanitizedConfiguredName.includes('.') ? sanitizedConfiguredName : `${sanitizedConfiguredName}${extension}`
  }

  const fallbackName = sanitizeFilenamePart(defaultFileName)
  return fallbackName || `download${getFileExtension(defaultFileName)}`
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function buildCsvText(columns, rows) {
  const headerLine = columns.map((column) => escapeCsvValue(column)).join(',')
  const rowLines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row?.[column] ?? '')).join(','),
  )

  return [headerLine, ...rowLines].join('\r\n')
}

function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 1000)
}

async function decompressGzipCsvBlob(blob) {
  if (typeof DecompressionStream === 'undefined') {
    return null
  }

  try {
    const decompressionStream = new DecompressionStream('gzip')
    const decompressedStream = blob.stream().pipeThrough(decompressionStream)
    const decompressedResponse = new Response(decompressedStream)
    const decompressedText = await decompressedResponse.text()

    return new Blob([decompressedText], { type: 'text/csv;charset=utf-8' })
  } catch {
    return null
  }
}

export function buildCsvDownloadFileName({
  prefix,
  stationId,
  sourceId,
  defaultFileName,
  extraParts = [],
}) {
  const extension = getFileExtension(defaultFileName)
  const fileNameRoot = joinFileNameParts([prefix, stationId, ...extraParts, sourceId])

  return `${fileNameRoot || sanitizeFilenamePart(defaultFileName) || 'download'}${extension}`
}

export function buildRawSourceDownloadFiles({
  plotDefinition,
  station,
  popupState,
  plotState,
  sourceRecords,
}) {
  const csvDownload = plotDefinition.csvDownload

  if (!csvDownload?.enabled) {
    return []
  }

  const includedSourceIds = csvDownload.includeSources
    ? new Set(csvDownload.includeSources)
    : null

  return Object.entries(sourceRecords)
    .filter(([sourceId]) => !includedSourceIds || includedSourceIds.has(sourceId))
    .map(([sourceId, sourceRecord]) => {
      const defaultFileName = getFileNameFromUrl(sourceRecord.url) || `${plotDefinition.id}_${sourceId}.csv`

      return {
        kind: 'remote',
        url: sourceRecord.url,
        filename: resolveDownloadFileName({
          csvDownload,
          station,
          popupState,
          plotDefinition,
          plotState,
          sourceId,
          sourceUrl: sourceRecord.url,
          exportType: 'raw-source',
          defaultFileName,
        }),
      }
    })
}

export function buildTableDownloadFiles({
  plotDefinition,
  station,
  popupState,
  plotState,
  columns,
  rows,
}) {
  const csvDownload = plotDefinition.csvDownload

  if (!csvDownload?.enabled || !columns.length) {
    return []
  }

  const defaultFileName = `${plotDefinition.id}.csv`

  return [
    {
      kind: 'generated',
      content: buildCsvText(columns, rows),
      filename: resolveDownloadFileName({
        csvDownload,
        station,
        popupState,
        plotDefinition,
        plotState,
        exportType: 'table',
        defaultFileName,
      }),
    },
  ]
}

export function buildGeneratedCsvDownloadFiles({
  plotDefinition,
  station,
  popupState,
  plotState,
  sourceId,
  sourceUrl = null,
  columns,
  rows,
  defaultFileName = null,
}) {
  const csvDownload = plotDefinition.csvDownload

  if (!csvDownload?.enabled || !columns.length) {
    return []
  }

  const resolvedDefaultFileName = defaultFileName ?? `${plotDefinition.id}_${sourceId ?? 'data'}.csv`

  return [
    {
      kind: 'generated',
      content: buildCsvText(columns, rows),
      filename: resolveDownloadFileName({
        csvDownload,
        station,
        popupState,
        plotDefinition,
        plotState,
        sourceId,
        sourceUrl,
        exportType: 'generated',
        defaultFileName: resolvedDefaultFileName,
      }),
    },
  ]
}

export async function downloadCsvFiles(files) {
  for (const file of files) {
    if (file.kind === 'remote') {
      const response = await fetch(buildNoCacheUrl(file.url), {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Failed to download ${file.filename}.`)
      }

      const blob = await response.blob()
      const shouldDecompress = file.filename.endsWith('.csv.gz')
      const decompressedBlob = shouldDecompress ? await decompressGzipCsvBlob(blob) : null

      triggerBlobDownload(
        decompressedBlob ?? blob,
        decompressedBlob ? replaceGzipExtension(file.filename) : file.filename,
      )
    } else if (file.kind === 'generated') {
      const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8' })
      triggerBlobDownload(blob, file.filename)
    }

    await new Promise((resolve) => window.setTimeout(resolve, 80))
  }
}
