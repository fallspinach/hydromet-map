# Common Data Types

Apply the [common contract](./common-contract.md) plus the relevant requirements
below. A family is a set of related assets selected across dimensions, not a
requirement to store everything in one file. A publication may combine types.

## Raster families

Examples: CNRFC/UCRB/global model images and OCWD Landsat observations.

See the [raster publishing guide](./raster-families.md) for a producer workflow,
shared metadata layout, compact labels, Retro/NRT timelines, quality counts and
validation lessons from the pilots.

**Required:** declare the selected dimensions and actual availability; variable
quantities/units; image/grid dimensions; projection and georeferencing; pixel
orientation and footprint; missing pixels; and whether the asset is a precolored
image or numerical encoding. For an image overlay, supply its placement and
corner ordering in the form agreed with the renderer. Longitude/latitude corners
alone do not describe the projection of pixels inside the image. Dateline
crossing and longitude wrapping must be explicit.

For tiled rasters also describe tile addressing, zoom levels, tile size, bounds,
and the coordinate scheme. Tiled raster support is a profile to agree during
integration; the existing CNRFC PNG overlay is not a generic raster-tile loader.

### Precolored PNGs: colors are part of the data interpretation

**Required:** provide a machine-readable mapping with:

- The quantity and units of thresholds or category codes.
- Ordered colors and their exact RGBA values.
- Discrete intervals and boundary inclusion, or a continuous color mapping with
  its interpolation and normalization (linear, logarithmic, or otherwise).
- Under-range, over-range, missing-data and transparent-pixel meanings.
- Any clipping, saturation, resampling, or masking affecting interpretation.

A palette name, min/max pair, or rendered legend image alone is not enough when
it leaves the actual mapping ambiguous. Publish the sampled color table or a
precise, versioned definition. A legend image is a useful optional visual check,
but numerical thresholds are necessary for app-generated unit-aware labels.

Zero visible pixels must not be used as proof of missing data: valid values may
all fall in intentionally transparent bins. Declare background, missing and
hidden-value semantics even when they share the same transparent color.

Keep geographic imagery separate from embedded titles/legends where possible.
When display units change, the app can convert threshold labels while retaining
the encoded color bins. It cannot freely recolor a precolored image as though it
contained original measurements. Nor can a blended display pixel be assumed to
yield an exact source value. Publish a numerical companion asset if exact pixel
queries, analysis, or arbitrary recoloring are needed.

**Recommended:** nearest-neighbor display for categorical or discrete-color
rasters when interpolation would imply nonexistent categories. Describe any
intentional smoothing. The adapter must verify the image/legend correspondence.

## Static vector datasets, regular or tiled

Examples: property boundaries, wetlands, river networks, basins, wells and stations.
“Static” means there is no user-selected time/product dimension; corrections can
still create a new publication revision.

**Required:** geometry types; coordinate reference/order; stable feature identifier
and its type; attribute dictionary with quantities, units, categories and missing
values; geographic extent; and dataset version. Preserve identifiers such as
`00123` as strings when leading zeros matter.

For tiled vectors also declare the container/version, tile source-layer names,
zoom coverage, ID representation, and how IDs remain consistent across tiles and
zoom levels. Describe geometry generalization. Never use tile-local feature
positions as stable IDs for popup joins. A JavaScript consumer must not lose
precision when handling large integer IDs.

**Recommended:** GeoJSON for modest datasets; tiled delivery for large geometry
collections. Choose based on realistic browser loading and interaction tests,
not a universal feature-count threshold. Attribute meanings should be published
even if the map currently uses only a subset. Suggested styles and hover fields
are optional; the app owns interaction and project membership.

## Vector families

Examples: CNRFC streamflow and time-varying GRADES attributes joined to river
geometry. A family may instead publish a complete geometry set for each date.

**Required:** declare which dimensions change geometry, attributes, or both.
Identify the geometry dataset/version, the attribute dataset/version, join fields
and types, join cardinality, and which dimensions the join depends on. Specify
handling of unmatched IDs, duplicate records, missing attributes, and geometries
that appear or disappear. A missing match must not become zero streamflow.

For separate geometry and attribute tiles, document spatial partitioning and
whether matching records can be retrieved for every visible geometry. Stable
IDs alone do not guarantee that both sides of a tiled join are loaded.

**Recommended:** reuse immutable geometry where only values change. Publish a
compatibility identifier or version link so the app can detect mismatched
geometry/attribute revisions. Keep color-to-quantity metadata with the thematic
attribute publication, including percentile definitions where used.

## Data associated with vector features

Examples: station CSVs, basin forecasts, river hydrographs, well observations,
ensemble forecasts, climatology curves, and summary tables/maps.

**Required:** link to a feature dataset/version and declare the feature key.
Describe variables, units, source columns or array positions, time coordinates,
levels/depths, members/statistics, and their actual availability. Describe whether
a value applies to a point measurement, river reach, basin average, or other
spatial support. Distinguish local runoff from routed discharge.

### CSV and tabular delivery

Declare delimiter, character encoding (UTF-8 recommended), headers, missing-value
markers, timestamp format, numeric conventions, row ordering and duplicate rules.
Declare wide versus long layout. For wide ensemble files, explicitly map column
patterns such as `RUNOFF_{member}` to an enumerated member list. Do not require
consumers to deduce units or sensor depths from column names.

For tables, define each row/column meaning and any derived value, reference
period, normalization, exceedance direction, or aggregation. A summary map needs
an explicit relationship between table records and polygons. Recommended plot
groups can describe which variables belong together without specifying Plotly
or application code.

### Indexed binary delivery

Declare dtype, byte order, array shape, dimension order, byte offsets/headers,
packing, missing codes, index base, feature-index mapping, time coordinates and
partition rules. State whether dates are explicit or regularly generated and
how leap days are represented. Index and data revisions must agree. Include a
small decoded reference sample with expected physical values so an independent
reader can verify the layout.

### Performance and downloads

**Recommended:** publish bounded recent windows and/or date partitions for long
histories, with links to full archives. Publish enough index information for the
app to request only needed features and times. The CNRFC hourly app currently
plots two water years but still downloads the full gzip file; producer-side
partitioning would reduce transfer and parsing as well as plotting work.

Original and derived downloads should state their units and processing. Do not
change source units at an existing URL without a declared breaking revision.
