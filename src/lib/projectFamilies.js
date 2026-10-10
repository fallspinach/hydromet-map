// Family requirements are reusable; exclusivity is a project policy.
export function getFamilyLayerIds(family) {
  return [...new Set([
    family?.layerId,
    family?.raster?.layerId,
    ...Object.keys(family?.linkedLayers ?? {}),
    ...(family?.dependentLayerIds ?? []),
  ].filter(Boolean))]
}

export function getProjectFamilyIds(project) {
  return project.layerFamilyIds ?? (project.layerFamilyId ? [project.layerFamilyId] : [])
}

export function getFamilyState(state, project, familyId) {
  // Preserve the original primary-family state slot for existing projects.
  return familyId === project.layerFamilyId ? state.family : state.familyStateById?.[familyId]
}

export function setFamilyState(state, project, familyId, familyState) {
  return familyId === project.layerFamilyId
    ? { ...state, family: familyState }
    : { ...state, familyStateById: { ...state.familyStateById, [familyId]: familyState } }
}

export function normalizeProjectFamilies(state, project, families, preferredFamilyId) {
  const ids = getProjectFamilyIds(project)
  const activeFamilyId = ids.includes(preferredFamilyId)
    ? preferredFamilyId
    : ids.includes(state.activeFamilyId) ? state.activeFamilyId : project.layerFamilyId
  const layers = { ...state.layers }
  for (const group of project.exclusiveLayerFamilyGroups ?? []) {
    const winner = group.includes(activeFamilyId)
      ? activeFamilyId
      : group.find((id) => getFamilyLayerIds(families[id]).some((layerId) => layers[layerId]))
    if (!winner) continue
    for (const id of group) {
      if (id !== winner) {
        for (const layerId of getFamilyLayerIds(families[id])) layers[layerId] = false
      }
    }
  }
  return { ...state, activeFamilyId, layers }
}

export function toggleProjectLayer(state, project, families, layerId) {
  if (!project.availableLayerIds.includes(layerId)) return state
  if (state.layers[layerId]) {
    return { ...state, layers: { ...state.layers, [layerId]: false } }
  }
  const ids = getProjectFamilyIds(project)
  const ownerId = ids.find((id) => getFamilyLayerIds(families[id]).includes(layerId))
  const familyVisibleLayers = { ...state.familyVisibleLayers }
  let layers = { ...state.layers }
  if (ownerId && ownerId !== state.activeFamilyId) {
    for (const group of project.exclusiveLayerFamilyGroups ?? []) {
      if (!group.includes(ownerId)) continue
      for (const id of group) {
        if (id === ownerId) continue
        const visible = getFamilyLayerIds(families[id]).filter((key) => layers[key])
        if (id === state.activeFamilyId || visible.length) familyVisibleLayers[id] = visible
      }
    }
    for (const key of familyVisibleLayers[ownerId] ?? []) {
      if (project.availableLayerIds.includes(key)) layers[key] = true
    }
  }
  layers[layerId] = true
  return normalizeProjectFamilies(
    { ...state, layers, familyVisibleLayers }, project, families, ownerId ?? state.activeFamilyId,
  )
}
