import { Layer, Source } from 'react-map-gl/maplibre'

const CNRFC_REGION_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/cnrfc/csv/cnrfc_line.geojson'

const cnrfcRegionLayer = {
  id: 'cnrfcRegion',
  isVisible: ({ appState }) => appState.layers.cnrfcRegion,
  renderLayers() {
    return (
      <Source id="cnrfc-region-source" type="geojson" data={CNRFC_REGION_GEOJSON_URL}>
        <Layer
          id="cnrfc-region-outline"
          type="line"
          paint={{
            'line-color': '#6b7280',
            'line-width': 3.5,
            'line-opacity': 0.95,
          }}
        />
      </Source>
    )
  },
}

export default cnrfcRegionLayer
