export function getProductMembers(family, product) {
  return family?.selectors?.productOptions?.[product]?.ensembleTraces
    ?? family?.selectors?.ensembleTraces ?? []
}

export function getProductVariables(family, product) {
  const variables = family?.raster?.variables ?? {}
  const allowed = family?.selectors?.productOptions?.[product]?.variables
  return allowed ? Object.fromEntries(allowed.map((id) => [id, variables[id]])) : variables
}

export function getProductMaxDate(family, product, boundary) {
  const days = family?.selectors?.productOptions?.[product]?.maxLeadDays
  if (!days || !boundary?.boundaryDate) return boundary?.maxDate ?? null
  const date = new Date(`${boundary.boundaryDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function normalizeRasterProduct(state, family) {
  const next = { ...state }
  const allowed = family?.selectors?.productOptions?.[state.product]?.variables
  if (allowed && !allowed.includes(next.variable)) {
    next.variable = allowed[0]
    next.temporalMode = 'date'
  }
  const members = getProductMembers(family, next.product)
  if (members.length || Object.hasOwn(next, 'ensemble')) {
    next.ensemble = members.includes(next.ensemble) ? next.ensemble : members[0] ?? ''
  }
  return next
}
