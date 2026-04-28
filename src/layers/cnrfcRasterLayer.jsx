import { Layer, Source } from 'react-map-gl/maplibre'
import { RASTER_PLACEHOLDER_GEOJSON } from '../data/placeholderOverlays'

const cnrfcRasterLayer = {
  id: 'cnrfcRaster',
  isVisible: ({ appState, selectedVariable }) => appState.layers.cnrfcRaster && Boolean(selectedVariable),
  renderLayers({ appState, selectedVariable }) {
    if (!selectedVariable) {
      return null
    }

    const rasterUrl = selectedVariable.buildRasterUrl?.(appState.family)
    const rasterCoordinates = selectedVariable.coordinates

    if (rasterUrl && rasterCoordinates) {
      return (
        <Source
          id="raster-source"
          type="image"
          url={rasterUrl}
          coordinates={rasterCoordinates}
        >
          <Layer
            id="raster-image-layer"
            type="raster"
            paint={{
              'raster-opacity': 0.7,
            }}
          />
        </Source>
      )
    }

    return (
      <Source id="raster-source" type="geojson" data={RASTER_PLACEHOLDER_GEOJSON}>
        <Layer
          id="raster-fill"
          type="fill"
          paint={{
            'fill-color': selectedVariable.palette.colors[selectedVariable.palette.colors.length - 1],
            'fill-opacity': 0.22,
          }}
        />
        <Layer
          id="raster-outline"
          type="line"
          paint={{
            'line-color': selectedVariable.palette.colors[selectedVariable.palette.colors.length - 2],
            'line-width': 2,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>
    )
  },
}

export default cnrfcRasterLayer
