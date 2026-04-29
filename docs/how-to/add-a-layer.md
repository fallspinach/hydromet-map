# How To Add a Layer

This guide covers the most common layer workflow:

1. define the layer in configuration
2. create the layer module
3. style it
4. add hover, highlight, and labels if needed
5. attach it to one or more projects

## 1. Decide what kind of layer you are adding

The app currently uses several patterns:

- `vector`
  - plain GeoJSON or other simple vector sources
- `vector-tile`
  - PMTiles-backed tiled lines, polygons, or points
- `png-overlay`
  - raster image overlays controlled by a layer family

Examples:

- vector point layer:
  - [src/layers/cnrfcPointsLayer.jsx](../../src/layers/cnrfcPointsLayer.jsx)
- vector polygon layer:
  - [src/layers/b120BasinsLayer.jsx](../../src/layers/b120BasinsLayer.jsx)
- vector-tile line layer:
  - [src/layers/cnrfcRiversLayer.jsx](../../src/layers/cnrfcRiversLayer.jsx)
- vector-tile layer with joined feature-state data:
  - [src/layers/cnrfcStreamflowLayer.jsx](../../src/layers/cnrfcStreamflowLayer.jsx)

## 2. Add the layer definition to `mapConfig.js`

Add an entry to:

- [src/config/mapConfig.js](../../src/config/mapConfig.js)

Specifically:

- add a layer item to `ALL_MAP_LAYERS`
- add any new source URL constants
- add any new source-layer name constants

Typical layer metadata includes:

```js
{
  id: 'myLayer',
  label: 'My Layer',
  type: 'vector-tile',
  description: 'What the layer shows.',
  symbol: '\uFF5E',
  symbolColor: '#008b8b',
}
```

This metadata drives the layer toggle list and project configuration.

## 3. Create the layer module in `src/layers/`

Create a new file such as:

- `src/layers/myLayer.jsx`

Then register it in:

- [src/layers/index.js](../../src/layers/index.js)

Typical shape:

```js
const myLayer = {
  id: 'myLayer',
  stateKey: 'hoveredMyFeature',
  isVisible: ({ appState }) => appState.layers.myLayer,
  getInteractiveLayerIds() {
    return ['my-layer-fill']
  },
  getPointerState({ event }) { ... },
  getPointerLeaveState() { ... },
  handleClick(context) { ... },
  renderLayers(context) { ... },
  renderPopups(context) { ... },
}
```

Not every layer needs every field.

## 4. Style the layer

Add the actual `Source` and `Layer` tree in `renderLayers`.

Common styling patterns already used in the app:

- fill polygon layer
- line layer
- circle point layer
- symbol text layer
- highlight layer
- white casing under linework for better readability on satellite basemaps

Examples to copy:

- polygon + highlight:
  - [src/layers/b120BasinsLayer.jsx](../../src/layers/b120BasinsLayer.jsx)
- line + casing + highlight:
  - [src/layers/cnrfcRiversLayer.jsx](../../src/layers/cnrfcRiversLayer.jsx)
- point + highlight + label:
  - [src/layers/gshaLayer.jsx](../../src/layers/gshaLayer.jsx)

### Line styling

Use a `line` layer and often a matching highlight layer.

Recommended line structure:

1. optional white casing layer
2. main colored line layer
3. red highlight layer filtered to the hovered feature

This is especially helpful on:

- `Terrain`
- `Satellite`

### Point styling

Use:

- `circle` for filled points
- `symbol` if you want a glyph or text-like symbol

Examples:

- filled circles:
  - `cnrfcPoints`
  - `yampaPoints`
- symbol glyph:
  - `geodar`

### Labels

If the layer needs labels, add a separate symbol layer.

Example:

- [src/layers/gshaLayer.jsx](../../src/layers/gshaLayer.jsx)

That pattern uses:

- `text-field`
- `text-font`
- `text-size`
- `text-offset`
- halo styling
- `minzoom`

## 5. Add hover state

If the layer should show hover info:

- define `stateKey`
- implement `getPointerState`
- implement `getPointerLeaveState`
- optionally render a hover popup in `renderPopups`

Pattern:

1. MapLibre hit test finds the hovered feature
2. layer module converts raw properties into a cleaner hover object
3. hover object is stored in `interactionState`
4. highlight and popup both read from that hover object

Examples:

- simple hover popup:
  - [src/layers/hydroRiversLayer.jsx](../../src/layers/hydroRiversLayer.jsx)
- hover popup plus feature popup:
  - [src/layers/gradesHydroDlLayer.jsx](../../src/layers/gradesHydroDlLayer.jsx)

## 6. Add highlight behavior

The usual pattern is a second style layer filtered to the hovered feature id.

Example filter pattern:

```js
filter={['==', ['get', 'COMID'], interactionState.hoveredGradesHydroDl?.comid ?? '__none__']}
```

Recommended:

- keep the highlight color consistent
  - current common choice is red
- reuse the same width expression as the base layer
- for polygons, use stronger outline or fill opacity

## 7. Add hover info popup

If the layer only needs lightweight inspection:

- build a hover object in `getPointerState`
- return a `<Popup>` in `renderPopups`

This is enough for many inspection-only layers such as:

- `meritBasins`
- `grit`
- `hydroRivers`
- `geodar`

If the layer later needs a real feature popup with plots or tabs, keep the hover popup and add `handleClick`.

## 8. Add click behavior if needed

If the layer should open a feature popup:

- implement `handleClick`
- populate `selectedStation`
- either render the popup directly from the layer module or through a popup family rendered from `MapCanvas.jsx`

Two current patterns:

- popup rendered directly by the layer module
  - common for simpler station layers
- popup rendered once from `MapCanvas.jsx`
  - used by:
    - `globalReachPopup`
    - `cnrfcStreamflowPopup`

## 9. Add the layer to one or more projects

Edit:

- [src/config/mapConfig.js](../../src/config/mapConfig.js)

Update:

- `availableLayerIds`
- `defaultVisibleLayerIds`

Order matters:

- `availableLayerIds` controls toggle-list order
- [src/layers/index.js](../../src/layers/index.js) controls render order

## 10. Test checklist

After adding a layer, check:

- it appears in the right project layer list
- the toggle works
- render order looks correct
- hover works
- highlight works
- labels appear at the intended zoom
- click behavior works if present
- bookmarks preserve visibility
- mobile interaction is still usable

## Recommended examples to clone

- simple point layer:
  - `cnrfcPoints`
- labeled point layer:
  - `gsha`
- simple vector-tile line layer:
  - `ucrbRivers`
- line layer with popup:
  - `gradesHydroDl`
- linked family layer with feature-state join:
  - `cnrfcStreamflow`
