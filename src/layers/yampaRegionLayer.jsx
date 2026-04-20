import { Layer, Source } from 'react-map-gl/maplibre'

const YAMPA_REGION_GEOJSON_URL = 'https://cw3e.ucsd.edu/hydro/yampa/csv/yampa_line.geojson'

const yampaRegionLayer = {
  id: 'yampaRegion',
  isVisible: ({ appState }) => appState.layers.yampaRegion,
  renderLayers() {
    return (
      <Source id="yampa-region-source" type="geojson" data={YAMPA_REGION_GEOJSON_URL}>
        <Layer
          id="yampa-region-outline"
          type="line"
          paint={{
            'line-color': '#0b3b8f',
            'line-width': 2.5,
            'line-opacity': 0.95,
          }}
        />
      </Source>
    )
  },
}

export default yampaRegionLayer
