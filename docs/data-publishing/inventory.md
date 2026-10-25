# Current Source Inventory and Gaps

Reviewed against the [layer registry](../../src/layers/index.js),
[family configuration](../../src/config/mapConfig.js), and linked loaders on
2026-10-25. This is an implementation inventory, not verification of every remote
file. Every registered layer is assigned below; some have several data roles.

| Registered layer IDs | Publication pattern | Interpretation to move into producer metadata |
| --- | --- | --- |
| `cnrfcRaster`, `ucrbRaster`, `globalRaster` | Family-selected precolored PNGs | URL dimensions/availability, physical quantities, units, image placement, exact palettes, temporal intervals |
| `ocwdLandsat8Raster` | PNGs with existing Landsat manifest | Index meanings, complete color mapping, observation/quality semantics; preserve dates, valid-pixel counts and placement already published |
| `cnrfcRegion`, `ucrbRegion`, `yampaRegion`, `ocwdBoundary`, `ocwdWetlands`, `pradoBasin`, `b120Basins` | Static vector polygons | Stable IDs, source provenance, attribute meanings, boundary/extent interpretation |
| `cnrfcBasins`, `hucBasins` | Tiled basin polygons | Source-layer names, basin identity/hierarchy, geometry revision and join keys |
| `cnrfcRivers`, `ucrbRivers`, `conusRivers`, `gradesHydroDlStatic`, `swordReaches`, `meritBasins`, `camaFlood`, `grit`, `hydroRivers` | Tiled hydrography | Attribute units, reach IDs, geometry type, network relationships and version compatibility; do not infer geometry from a layer's name |
| `cnrfcStreamflow`, `gradesHydroDl` | River geometry joined to changing tiled attributes; binary popup data | Join/index contracts, temporal coverage, flow/rank distinction, climatology definitions and encoding |
| `cnrfcPoints` | Vector locations plus station CSVs, including WWRF-Ens | Station keys, daily/hourly/monthly time meaning, column quantities, units, packing, missing sentinels and member mappings |
| `b120Points`, `yampaPoints` | Vector locations plus forecast/history CSVs, tables and summary maps | Issue/update time, product/postprocessing dimensions, basin joins, volume units, averages and exceedance meanings |
| `ocwdWells` | Tiled well locations plus observation CSVs | Well keys, water-level reference, column meanings/units, timestamps and quality |
| `gsha` | Tiled gauges plus indexed binary series | Gauge identity, binary layout, time axes, quantities/units and quality |
| `geodar` | Tiled reservoir features | Identifier and attribute dictionary, units, geometry meaning and provenance |
| `cw3eMetObs` | Observation locations plus recent station CSVs | Sensor quantity/depth, units, aggregation, quality flags and column mappings currently inferred in configuration |
| `snowCourses`, `snowPillows` | Observation locations plus station time series | Station keys, source units, observation frequency, missing markers and time conventions |
| `gfsIvtParticles` | Catalog/run manifests, encoded textures and masks | Reuse the explicit existing vector-field contract; clarify portable quantity/basis metadata |
| `arRecon3d` | Flight catalog/manifests and aircraft/sonde assets | Trajectory/profile coordinates, vertical references, quantities, quality and relationships |

## Family behavior versus publication

| Current family | Publication dimensions/relationships to describe |
| --- | --- |
| `cnrfc` | Variable, date/time, forecast product, product-specific members; linked raster/streamflow availability |
| `ucrb` | Variable, date/time and product, with regional placement |
| `globalHydro` | Global raster variables and time-dependent river attributes/series |
| `ocwdLandsat8` | Index variable and available observation dates |
| `arRecon` | Flight year/selection plus associated GFS run/lead-time selection; these need not become one producer dataset |

Projects, layer ordering, family exclusivity, bookmarks, basemaps, temporary
measurement overlays and context-menu analysis results are application concerns.
They should not force producers to mirror the application's project tree.
Service-generated analysis results can adopt the common metadata when published,
but their request/response APIs need a separate integration review.

## Existing implementation anchors

- [Raster configuration](../../src/config/mapConfig.js): many meanings, palettes,
  paths and defaults are still hardcoded.
- [Landsat manifest reader](../../src/lib/manifestRaster.js): consumes images,
  placement and color metadata, but also depends on configured variables and
  application colormap definitions. It is not a universal manifest reader.
- [Plot source adapters](../../src/lib/plotDataSources.js): CSV and binary adapters
  normalize records; some transformations still live in popup-specific code.
- [CNRFC binary](../../src/lib/cnrfcBinaryData.js),
  [GRADES binary](../../src/lib/gradesBinaryData.js), and
  [GSHA binary](../../src/lib/gshaBinaryData.js): descriptors exist, while offsets,
  interpretation and joins also depend on adapter logic.
- [Popup documentation](../popups.md): current per-product plots and exports.
- [AR Recon loader](../../src/lib/arReconData.js) and
  [IVT publishing contract](../particle-tracers.md): useful specialized examples.

The first migration task for each producer is to compare its published metadata
with the meanings currently supplied by these integrations. Do not copy an app
assumption into a manifest without producer confirmation.
