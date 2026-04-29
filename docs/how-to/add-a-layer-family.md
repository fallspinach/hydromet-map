# How To Add a Layer Family

This guide explains how to add a new layer family with its own selectors and shared state.

A layer family is the right tool when several layers should move together with the same:

- variable
- product
- date
- datetime
- ensemble

It can drive:

- raster overlays
- linked vector/vector-tile layers
- or both

## 1. Decide whether you need a new family

A new family is usually the right choice when the new dataset has a different:

- spatial domain
- variable list
- product list
- date or datetime semantics
- linked-layer data source logic

Current families:

- `cnrfc`
- `ucrb`

See:

- [docs/raster.md](../raster.md)

## 2. Add a new entry to `LAYER_FAMILIES`

Edit:

- [src/config/mapConfig.js](../../src/config/mapConfig.js)

Typical shape:

```js
myFamily: {
  id: 'myFamily',
  label: 'My Domain',
  raster: {
    layerId: 'myRaster',
    variables: MY_RASTER_VARIABLES,
  },
  selectors: {
    products: ['NRT', 'GFS'],
    ensembleTraces: ['Control', 'Mean'],
    statusUrl: 'https://example.com/status.json',
    statusKey: 'WRF-Hydro NRT',
    defaultDate: '2026-04-13',
    defaultDateTime: '2026-04-13T12:00',
  },
  linkedLayers: {
    myVectorLayer: {
      buildDataPmtilesUrl: ({ date, product }) => ...,
    },
  },
}
```

## 3. Define selector behavior

Selectors live under `selectors`.

These values feed:

- `MapHud.jsx`
- bookmark state
- project family state
- family-driven layers

Common fields:

- `products`
- `ensembleTraces`
- `statusUrl`
- `statusKey`
- `defaultDate`
- `defaultDateTime`

`statusUrl` and `statusKey` are what allow the app to replace the hard-coded fallback dates with remote current status data at startup.

## 4. Add raster support if needed

If the family includes a raster overlay:

1. define raster variables
2. define `raster.layerId`
3. implement or reuse a raster layer module

Current raster layer modules:

- [src/layers/cnrfcRasterLayer.jsx](../../src/layers/cnrfcRasterLayer.jsx)
- [src/layers/ucrbRasterLayer.jsx](../../src/layers/ucrbRasterLayer.jsx)

Each raster variable typically defines:

- `label`
- `units`
- `timestep`
- `coordinates`
- `palette`
- `buildRasterUrl`

## 5. Add linked vector layers if needed

If the family should also drive non-raster layers, use `linkedLayers`.

Current example:

- `cnrfcStreamflow`

That family-linked layer:

- shares CNRFC selector state
- builds a PMTiles URL from `date` and `product`
- joins tiled attributes to geometry by `feature_id`

This is the main reason the app moved from a “raster family” concept to a more general “layer family” concept.

## 6. Make sure the family state has sensible defaults

Default state is built through:

- `buildDefaultFamilyState(layerFamily)`

in:

- [src/config/mapConfig.js](../../src/config/mapConfig.js)

This state becomes:

```js
family: {
  variable,
  product,
  ensemble,
  temporalMode,
  date,
  datetime,
}
```

If the project needs different defaults from the family’s base defaults, use project-level `defaultFamily` overrides.

## 7. Connect the family to a project

Families are not visible by themselves. A project has to reference them through:

- `layerFamilyId`

in the project definition.

Projects may include:

- zero layer families
- or exactly one layer family

That keeps the selector UI unambiguous.

## 8. Test checklist

After adding a family, test:

- the right selectors appear in the HUD
- variable options are correct
- product options are correct
- ensemble options are correct
- bookmark URLs persist family state
- startup status refresh replaces default dates correctly
- family-linked vector layers react to selector changes if present
- project switching preserves family state

## Recommended examples to copy

- raster-only family baseline:
  - `ucrb`
- raster + linked vector family:
  - `cnrfc`
