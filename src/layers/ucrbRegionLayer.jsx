import { Layer, Source } from 'react-map-gl/maplibre'

const UCRB_REGION_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/ucrb/csv/ucrb_line.geojson'

const ucrbRegionLayer = {
  id: 'ucrbRegion',
  isVisible: ({ appState }) => appState.layers.ucrbRegion,
  renderLayers() {
    return (
      <Source id="ucrb-region-source" type="geojson" data={UCRB_REGION_GEOJSON_URL}>
        <Layer
          id="ucrb-region-outline"
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

export default ucrbRegionLayer
