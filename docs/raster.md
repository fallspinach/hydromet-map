# Layer Families and Raster Layers

## Purpose

A layer family defines the shared selector behavior for a project and may drive one or more dependent layers.

Each project may include:

- zero layer families
- or exactly one layer family

This keeps the selector UI unambiguous and lets multiple layers share the same date/product/ensemble state.

## Current location

Layer family definitions live in [src/config/mapConfig.js](../src/config/mapConfig.js) under `LAYER_FAMILIES`.

Current families:

- `cnrfc`
- `ucrb`

## What a layer family defines

Typical fields:

```js
{
  id,
  label,
  selectors,
  raster,
  linkedLayers,
}
```

Typical selector fields:

- `products`
- `ensembleTraces`
- `statusUrl`
- `statusKey`
- `defaultDate`
- `defaultDateTime`

Typical raster fields:

- `layerId`
- `variables`

## Variable definitions

Raster variables currently live under `CNRFC_RASTER_VARIABLES` and `UCRB_RASTER_VARIABLES`.

Each variable defines:

- `label`
- `units`
- `timestep`
- `coordinates`
- `palette`
- `buildRasterUrl`

Example shape:

```js
precipitationDaily: {
  label: 'Daily P',
  units: 'mm',
  timestep: '1day',
  coordinates: ...,
  palette: {
    thresholds: [...],
    colors: [...],
  },
  buildRasterUrl: ({ date, product }) => ...,
}
```

## How selector options are derived

The raster toolbar in [src/components/map/MapHud.jsx](../src/components/map/MapHud.jsx) reads everything from the active project's layer family.

That means:

- variable options come from `layerFamily.raster.variables`
- product options come from `layerFamily.selectors.products`
- ensemble options come from `layerFamily.selectors.ensembleTraces`

The selected variable also determines whether the app uses:

- date mode
- or datetime mode

through `getTemporalModeForTimestep()`.

## Project-level family defaults

Projects can override family defaults through `defaultFamily`.

Current examples:

- `cnrfc` defaults to `soilMoistureDaily`
- `b120` defaults to `sweDaily`
- `yampa` defaults to `sweDaily`

This is implemented by merging `projectDefinition.defaultFamily` over `buildDefaultFamilyState(layerFamily)` in [src/config/mapConfig.js](../src/config/mapConfig.js).

## Raster rendering

Raster rendering currently happens in:

- [src/layers/cnrfcRasterLayer.jsx](../src/layers/cnrfcRasterLayer.jsx)
- [src/layers/ucrbRasterLayer.jsx](../src/layers/ucrbRasterLayer.jsx)

Behavior:

- if `buildRasterUrl()` returns a valid PNG URL, the raster is rendered as an image source
- otherwise, a placeholder polygon is rendered using the variable palette

Current opacity:

- `0.7`

## Linked family layers

A layer family can also declare linked non-raster layers that depend on the same selector state.

Current example:

- `cnrfcStreamflow`

It uses a linked-layer URL builder to load date/product-specific PMTiles and then joins lightweight attribute tiles to the river geometry layer through `feature_id` and `feature-state`.

## When adding a new layer family

1. Add a new entry to `LAYER_FAMILIES`.
2. Define selector options/defaults.
3. Define raster config if the family drives a raster overlay.
4. Define any linked layer builders if vector/vector-tile layers also depend on the family state.
5. Reference the family from a project through `layerFamilyId`.
6. Optionally set project-specific `defaultFamily`.

## Recommendation

If the new raster source has:

- a different domain
- a different variable list
- a different product list
- or different date semantics

prefer creating a new layer family and a new project rather than overloading the existing `cnrfc` family.
