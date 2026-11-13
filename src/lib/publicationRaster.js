// Temporary selector labels until the producer supplies shortLabel.
const SHORT_LABELS = {
  precipitation: 'Daily P',
  temperature: 'Daily T',
  soil_water_percentile: 'Daily SM %-ile',
  swe_percentile: 'Daily SWE %-ile',
  precipitation_percentile: 'Monthly P %-ile',
  temperature_percentile: 'Monthly T %-ile',
}

// Adapter for the Hydro Ops publication pilot; source semantics stay in its metadata.
export async function loadPublicationRaster(definition, readJson) {
  const base = definition.manifestUrl
  const manifest = await readJson(base)
  const resolve = (href, parent = base) => {
    const url = new URL(href, parent)
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported publication URL')
    return url.href
  }
  if (manifest.convention !== 'hydro-ops-raster-pilot' || manifest.conventionVersion !== '0.4'
    || manifest.pixelProjection !== 'EPSG:3857'
    || manifest.placement?.cornerOrder?.join(',') !== 'top-left,top-right,bottom-right,bottom-left'
    || manifest.placement?.pixelReference !== 'outer-edges'
    || manifest.placement?.rowOrder !== 'north-to-south') throw new Error('Unsupported publication geometry or convention')
  const coordinates = manifest.placement.corners
  if (!Array.isArray(coordinates) || coordinates.length !== 4 || coordinates.some(p =>
    !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90)) {
    throw new Error('Invalid publication corners')
  }
  const availabilityUrl = resolve(manifest.availability)
  const [dictionary, legends, availability, timeline] = await Promise.all([
    readJson(resolve(manifest.variables)), readJson(resolve(manifest.legends)),
    readJson(availabilityUrl), readJson(resolve(manifest.timeline)),
  ])
  const assets = new Map()
  for (const asset of availability.assets) {
    if (assets.has(asset.id)) throw new Error('Duplicate publication asset')
    assets.set(asset.id, asset)
  }
  const variables = {}
  for (const entry of timeline.entries) {
    const asset = assets.get(entry.preferredAsset)
    if (!asset || !entry.availableAssets.includes(asset.id) ||
      ['variable', 'product', 'resolution', 'date'].some(k => asset[k] !== entry[k])) throw new Error('Invalid preferred asset')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asset.date) || !Number.isFinite(Date.parse(asset.date)) ||
      new Date(asset.date).toISOString().slice(0, 10) !== asset.date || asset.mediaType !== 'image/png' ||
      asset.encoding !== 'precolored-rgba') throw new Error('Unsupported publication asset')
    const id = asset.variable
    const metadata = dictionary.variables[id]
    const legend = legends[asset.legendId]
    if (!metadata || !legend?.bins?.length || legend.type !== 'discrete') throw new Error('Missing variable or discrete legend')
    if (!variables[id]) {
      variables[id] = {
        label: metadata.label, shortLabel: metadata.shortLabel || SHORT_LABELS[id] || metadata.label, units: legend.displayUnitLabel ?? legend.thresholdUnit, timestep: asset.resolution === 'monthly' ? '1month' : '1day',
        resolution: asset.resolution, product: asset.product, legendId: asset.legendId,
        coordinates, resampling: 'nearest', availableDates: [], assetsByDate: {},
        palette: {
          colors: legend.bins.map(bin => bin.color),
          thresholds: legend.bins.slice(0, -1).map(bin => String(bin.upper)),
        },
        buildRasterUrl: ({ date }) => variables[id].assetsByDate[date]?.url ?? null,
      }
    }
    const variable = variables[id]
    if (variable.product !== asset.product || variable.resolution !== asset.resolution || variable.legendId !== asset.legendId || variable.assetsByDate[asset.date]) {
      throw new Error('Ambiguous variable timeline; separate selectors are required')
    }
    variable.assetsByDate[asset.date] = { ...asset, url: resolve(asset.href, availabilityUrl) }
    variable.availableDates.push(asset.date)
  }
  if (!Object.keys(variables).length) throw new Error('Empty publication timeline')
  for (const variable of Object.values(variables)) variable.availableDates.sort()
  return { ...definition, publication: manifest, raster: { ...definition.raster, variables } }
}

// Move in calendar units, then choose an available date in that direction.
export function stepPublicationDate(date, dates, amount, unit) {
  if (!date || !dates.length) return date
  const target = new Date(`${date}T12:00:00Z`)
  if (unit === 'month') {
    const day = target.getUTCDate()
    target.setUTCDate(1)
    target.setUTCMonth(target.getUTCMonth() + amount)
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    target.setUTCDate(Math.min(day, lastDay))
  } else target.setUTCDate(target.getUTCDate() + amount)
  const iso = target.toISOString().slice(0, 10)
  return amount > 0
    ? dates.find(d => d >= iso) ?? dates.at(-1)
    : dates.findLast(d => d <= iso) ?? dates[0]
}
