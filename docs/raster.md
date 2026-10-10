# Layer Families and Raster Layers

## Purpose

A layer family defines the shared selector behavior for a project and may drive one or more dependent layers.

Projects can offer several layer families with one active control/legend area.
Related layers share their family's date/product/variable state. Project-level
exclusive groups prevent incompatible families from being displayed together.
Existing single-family projects retain their configuration and behavior.

## Current location

Layer family definitions live in [src/config/mapConfig.js](../src/config/mapConfig.js) under `LAYER_FAMILIES`.

Current families: `cnrfc`, `ucrb`, `globalHydro`, `arRecon`, and `ocwdLandsat8`.

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

create a reusable layer family rather than overloading `cnrfc`. A project can offer it alongside another family using the exclusive switching policy below.

## Manifest-driven PNG observations

`ocwdLandsat8` (OCWD Landsat 8) uses a reusable `manifest-raster` family:

- `manifestUrl` identifies a JSON catalog of images.
- `raster.variables` supplies stable variable IDs and display labels.
- The manifest supplies `maplibre_coordinates_lon_lat`, `crs: "EPSG:3857"`,
  `resampling`, `color_scale` (`vmin`, `vmax`, `cmap`, and a legend image), and
  `images` entries with `index`, `date`, `file`, and `valid_pixels`.
- Relative image/legend paths resolve against the manifest URL.
- Only valid dates with positive valid-pixel counts are offered. Partial images
  remain available; dates are filtered separately for each variable.
- An unset date selects the latest nonempty observation. An unavailable date
  selects the preceding available observation, or the first if none precedes it.
- Previous/next buttons step through observations. The calendar disables missing
  dates and offers month/year navigation. No forecast or ensemble controls appear.
- PNGs render at the family's configured opacity (70% for OCWD Landsat 8) with
  their published resampling mode. BrBG uses the
  standard vertical legend: ten interval-midpoint colors sampled from Matplotlib,
  with boundaries from the manifest's minimum to maximum (−1 to +1 for Landsat).
  The palette is stored in `src/config/colorMaps.js`; unknown colormaps fall back
  to the manifest's colorbar image.
- Loading errors show a retry action without displaying a fabricated raster.

Implementation: `src/lib/manifestRaster.js`, `src/features/manifestRaster/`, and
`createManifestRasterLayer()` in `src/layers/manifestRasterLayer.jsx`. Register
an adapter for each new manifest raster layer in `src/layers/index.js`.

## Project-level family switching

OCWD demonstrates this configuration:

```js
layerFamilyId: 'cnrfc', // primary family; retains legacy bookmark meaning
layerFamilyIds: ['cnrfc', 'ocwdLandsat8'],
defaultActiveFamilyId: 'ocwdLandsat8',
exclusiveLayerFamilyGroups: [['cnrfc', 'ocwdLandsat8']],
```

`getFamilyLayerIds()` derives intrinsic membership from a family's `layerId`,
`raster.layerId`, `linkedLayers`, and optional `dependentLayerIds`. Static context
layers should not be listed as dependent layers merely because they cover the
same domain.

Enabling a family-owned layer selects its family, hides all layers in competing
families, and restores that family's previously visible sibling layers. Turning
off one layer leaves its siblings alone. Thus CNRFC streamflow can be displayed
without the CNRFC raster, but enabling Landsat hides both. Static rivers, basins,
wells, and boundaries retain their visibility. Family settings are remembered
within the project. Popups belonging to hidden family layers close.

The normalization and toggle functions in `src/lib/projectFamilies.js` apply the
same exclusivity policy to defaults, toggles, and bookmark loading. There is no
global CNRFC-versus-Landsat restriction. Simultaneous independent family controls
and legends are not implemented; projects using multiple independently controlled
families should currently place them in one exclusive group. AR Recon's existing
combined controls and intentional flight/IVT date coordination remain unchanged.

Run the focused regression checks with:

```sh
node --test tests/layer-families.test.mjs
```
