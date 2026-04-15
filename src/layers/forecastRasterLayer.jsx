import { Layer, Source } from 'react-map-gl/maplibre'
import { FORECAST_GEOJSON } from '../data/demoOverlays'

const forecastRasterLayer = {
  id: 'forecast',
  isVisible: ({ appState }) => appState.layers.forecast,
  renderLayers({ selectedVariable }) {
    return (
      <Source id="forecast-source" type="geojson" data={FORECAST_GEOJSON}>
        <Layer
          id="forecast-fill"
          type="fill"
          paint={{
            'fill-color': selectedVariable.palette.colors[selectedVariable.palette.colors.length - 1],
            'fill-opacity': 0.22,
          }}
        />
        <Layer
          id="forecast-outline"
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

export default forecastRasterLayer
