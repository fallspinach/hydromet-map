import { Layer, Source } from 'react-map-gl/maplibre'
import { FORECAST_BASINS_PMTILES_URL, FORECAST_BASINS_SOURCE_LAYER } from '../config/mapConfig'

const cnrfcBasinsLayer = {
  id: 'cnrfcBasins',
  isVisible: ({ appState }) => appState.layers.cnrfcBasins,
  renderLayers({ interactionState }) {
    return (
      <Source id="watersheds-source" type="vector" url={`pmtiles://${FORECAST_BASINS_PMTILES_URL}`}>
        <Layer
          id="watersheds-fill"
          type="fill"
          source-layer={FORECAST_BASINS_SOURCE_LAYER}
          filter={['==', ['get', 'Basin'], interactionState.hoveredCnrfcPoint?.id ?? '__none__']}
          paint={{
            'fill-color': '#2563eb',
            'fill-opacity': 0.16,
          }}
        />
        <Layer
          id="watersheds-outline"
          type="line"
          source-layer={FORECAST_BASINS_SOURCE_LAYER}
          filter={['==', ['get', 'Basin'], interactionState.hoveredCnrfcPoint?.id ?? '__none__']}
          paint={{
            'line-color': '#2563eb',
            'line-width': 2,
            'line-opacity': 0.9,
          }}
        />
      </Source>
    )
  },
}

export default cnrfcBasinsLayer
