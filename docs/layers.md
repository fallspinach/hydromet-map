# Layers

## Overview

In this app, a layer is a reusable map module.

A layer module is responsible for map-facing behavior such as:

- rendering MapLibre `Source` and `Layer` nodes
- defining hover and click hit-testing
- producing hover popup state
- optionally opening a feature popup

Projects do not reimplement layers. Instead:

- layer modules live once under `src/layers/`
- projects decide which layer ids are available
- layer families may supply shared selector state that some layers depend on

For the higher-level system view, see:

- [Architecture](./architecture.md)
- [Projects](./projects.md)
- [Layer Families and Raster Layers](./raster.md)

## Where layers live

Current registry:

- [src/layers/index.js](../src/layers/index.js)

Each layer module is registered there and then filtered by `MapCanvas.jsx` against the active project's `availableLayerIds`.

Important related files:

- [src/components/map/MapCanvas.jsx](../src/components/map/MapCanvas.jsx)
- [src/config/mapConfig.js](../src/config/mapConfig.js)

## The layer model

The current app has three distinct concepts:

### 1. Layer module

A layer module is the implementation.

It usually exports an object like:

```js
const myLayer = {
  id: 'myLayer',
  stateKey: 'hoveredMyFeature',
  isVisible(context) { ... },
  getInteractiveLayerIds(context) { ... },
  getPointerState(context) { ... },
  getPointerLeaveState(context) { ... },
  handleClick(context) { ... },
  renderLayers(context) { ... },
  renderPopups(context) { ... },
}
```

Not every layer needs every field.

### 2. Project membership

Projects decide:

- whether a layer is available
- whether it is visible by default
- where it appears in the toggle list

That configuration lives in:

- [src/config/mapConfig.js](../src/config/mapConfig.js)

under:

- `PROJECTS[*].availableLayerIds`
- `PROJECTS[*].defaultVisibleLayerIds`

### 3. Layer family dependency

Some layers are independent.

Others depend on the active layer family and its selector state:

- variable
- product
- date
- datetime
- ensemble

This is what lets one project-level selector row drive multiple layers at once.

## Layer module responsibilities

### `id`

Must match the id used in:

- `ALL_MAP_LAYERS`
- project `availableLayerIds`

Examples:

- `cnrfcRaster`
- `cnrfcStreamflow`
- `b120Points`
- `gradesHydroDl`

### `isVisible`

Controls whether the module should render in the current project state.

Most common pattern:

```js
isVisible: ({ appState }) => appState.layers.myLayerId
```

### `getInteractiveLayerIds`

Returns the MapLibre style-layer ids that should participate in hover/click hit testing.

### `getPointerState`

Transforms hovered features into a small normalized hover object stored in `interactionState`.

### `getPointerLeaveState`

Clears that hover object when the pointer leaves the map or hit-tested area.

### `handleClick`

Opens a feature popup or other selection state.

Return `true` when the click was handled so `MapCanvas.jsx` knows not to fall through.

### `renderLayers`

Returns the actual `Source` / `Layer` tree.

This is where styling, highlights, labels, and source definitions live.

### `renderPopups`

Returns hover popups and any layer-owned popup UI.

Some layers fully own their popups here. Others only render hover popups and let `MapCanvas.jsx` mount the feature popup once from shared state.

## How projects and layers relate

Projects do not own layer code. They only choose from the shared layer registry.

That means a project config answers:

- which layers can be turned on
- which layers start on
- what order the layer toggle list uses

The layer code itself remains global and reusable.

This is why the same layer can appear in more than one project:

- `cnrfcRaster` appears in both `cnrfc` and `b120`
- `snowCourses` and `snowPillows` appear across multiple projects

## How layer families and layers relate

A layer family is not a layer by itself. It is shared selector state plus optional configuration that one or more layers can consume.

Two important current patterns:

### Family-driven raster layer

Examples:

- `cnrfcRaster`
- `ucrbRaster`

These use:

- family variable definitions
- family products
- family dates/datetimes

### Family-linked vector layer

Current example:

- `cnrfcStreamflow`

This layer:

- shares the `cnrfc` family selectors with `cnrfcRaster`
- builds a date/product-specific PMTiles URL from family state
- joins lightweight attribute tiles to river geometry through `feature_id`
- uses `feature-state` for styling and hover values

That is the clearest example of why the app now uses the broader term `layer family` instead of `raster family`.

## Current layer categories

### Family-driven raster overlays

- `cnrfcRaster`
- `ucrbRaster`

### Family-linked thematic vector layer

- `cnrfcStreamflow`

### Regional static/shared vector layers

#### CNRFC

- `cnrfcRegion`
- `cnrfcRivers`
- `cnrfcBasins`
- `cnrfcPoints`

#### UCRB / Yampa

- `ucrbRegion`
- `ucrbRivers`
- `yampaRegion`
- `yampaPoints`

#### B120

- `b120Basins`
- `b120Points`

### Observation layers

- `snowCourses`
- `snowPillows`

### Global hydrography inspection layers

- `gradesHydroDl`
- `swordReaches`
- `meritBasins`
- `camaFlood`
- `grit`
- `hydroRivers`
- `gsha`
- `geodar`

## Popup ownership patterns

The app currently uses two popup ownership patterns for layers.

### Layer-owned popup pattern

The layer module renders its own popup directly in `renderPopups`.

This is common for:

- simpler hover popups
- some station-style feature popups

### Shared popup mounted from `MapCanvas.jsx`

The layer only populates `selectedStation`, and `MapCanvas.jsx` renders the popup component once.

Current examples:

- `gradesHydroDl` and `swordReaches`
  - shared `GlobalReachPopup`
- `cnrfcStreamflow`
  - dedicated `CnrfcStreamflowPopup`

This pattern is useful when:

- the popup is complex
- the layer already has a separate hover popup
- or multiple related layers share one popup family

## Hover, highlight, and labels

These concerns usually live entirely in the layer module.

### Hover

The layer builds a normalized hover object in `getPointerState`.

That object can then drive:

- hover popup content
- highlight filters
- derived readouts

### Highlight

The normal pattern is:

1. base style layer
2. highlight layer filtered to the hovered feature id

Line layers often use the same width expression for the highlight layer.

### Labels

Labels are usually separate symbol layers inside the same module.

Current example:

- `gsha`

## Line casing

Several line layers now use a white casing underneath the main linework so they remain legible on:

- `Terrain`
- `Satellite`

Current examples:

- `cnrfcRivers`
- `ucrbRivers`
- `gradesHydroDl`

This is an important styling pattern in the current app and is usually implemented as:

1. white casing line
2. colored main line
3. red hover highlight line

## Ordering rules

Two different orders matter.

### Toggle order

Controlled by project `availableLayerIds`.

### Render order

Controlled by module order in:

- [src/layers/index.js](../src/layers/index.js)

These are intentionally separate.

## Interaction state

`MapCanvas.jsx` owns transient shared hover state in `interactionState`.

Layer modules contribute to it through:

- `getPointerState`
- `getPointerLeaveState`

This lets each visible layer remain self-contained while still participating in one shared map interaction model.

## Temporary map-tool overlays are not project layers

Not every visible thing on the map belongs to the layer registry.

The context-menu tools also render temporary overlays such as:

- watershed polygons
- upstream river lines
- downstream flowpaths
- measurement preview/final lines

Those are rendered by:

- [src/components/map/MapToolOverlays.jsx](../src/components/map/MapToolOverlays.jsx)

and managed by:

- [src/components/map/useMapTools.js](../src/components/map/useMapTools.js)

They are intentionally separate from the reusable project-layer system.

## Practical rules when adding or changing a layer

- Keep source, styling, hover, highlight, and click behavior in the layer module.
- Keep project membership and toggle order in `mapConfig.js`.
- Keep family selector definitions in the layer family, not in the layer module.
- If popup behavior becomes complex, move it into a feature module under `src/features/`.
- If multiple layers need the same selector state, prefer linking them through a layer family instead of inventing parallel state.

## Related docs

- [How To Add a Layer](./how-to/add-a-layer.md)
- [How To Add a Popup](./how-to/add-a-popup.md)
- [How To Add a Layer Family](./how-to/add-a-layer-family.md)
- [How To Add a Project](./how-to/add-a-project.md)
