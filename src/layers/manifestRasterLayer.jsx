import { Layer, Source } from 'react-map-gl/maplibre'

// The adapter is shared by any family using the published PNG manifest contract.
export function createManifestRasterLayer(id) {
  return {
    id,
    isVisible: ({ appState, layerFamily }) => appState.layers[id] && layerFamily?.raster?.layerId === id,
    renderLayers({ appState, layerFamily, selectedVariable }) {
      const url = selectedVariable?.buildRasterUrl?.(appState.family)
      if (!url || !selectedVariable.coordinates) return null
      return (
        <Source id={`${id}-source`} type="image" url={url} coordinates={selectedVariable.coordinates}>
          <Layer id={`${id}-image`} type="raster" paint={{
            'raster-opacity': layerFamily.raster.opacity ?? 1,
            'raster-resampling': selectedVariable.resampling,
            'raster-fade-duration': 0,
          }} />
        </Source>
      )
    },
  }
}
