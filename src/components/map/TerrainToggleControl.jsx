import { useEffect, useRef } from 'react'
import { useControl, useMap } from 'react-map-gl/maplibre'
import { TERRAIN_SPEC } from '../../config/mapConfig'

export default function TerrainToggleControl({ enabled, onTerrainChange }) {
  const { current: map } = useMap()
  const callbackRef = useRef(onTerrainChange)

  callbackRef.current = onTerrainChange

  useControl(({ mapLib }) => new mapLib.TerrainControl(TERRAIN_SPEC), { position: 'top-right' })

  useEffect(() => {
    if (!map) {
      return undefined
    }

    const mapInstance = map.getMap()
    const syncTerrain = () => {
      callbackRef.current(Boolean(mapInstance.getTerrain()))
    }

    mapInstance.on('terrain', syncTerrain)
    syncTerrain()

    return () => {
      mapInstance.off('terrain', syncTerrain)
    }
  }, [map])

  useEffect(() => {
    if (!map) {
      return
    }

    const mapInstance = map.getMap()
    if (enabled && !mapInstance.getTerrain()) {
      mapInstance.setTerrain(TERRAIN_SPEC)
    }
    if (!enabled && mapInstance.getTerrain()) {
      mapInstance.setTerrain(null)
    }
  }, [enabled, map])

  return null
}
