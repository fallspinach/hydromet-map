# Publishing Data for Hydromet Map

**Status: proposed publication convention, draft 0.1 — 2026-10-25.**
This is guidance for coordination with data producers, not a claim that the app
already reads a universal manifest. Existing source formats continue to work
through their existing integrations. New manifest layouts need an agreed adapter
and a map preview before operational use.

You do not need to write application code or use Git to contribute. Start with a
sample and a description of what it means. Data production remains outside the
map application's scope; these documents describe what producers should publish
so the map can interpret their outputs reliably.

## Start here

1. Read the [common publication contract](./common-contract.md).
2. Choose a [common data type](./common-types.md): raster family, static vector,
   vector family, or feature-associated data.
3. For a new encoding or visualization, use the
   [specialized-data integration process](./specialized-data.md).
4. Use the [transition and acceptance checklist](./transition.md) to coordinate
   a pilot with the map maintainer.

The [current-source inventory](./inventory.md) explains the existing patterns and
where interpretation is still embedded in application code. The
[illustrative JSON examples](./examples/README.md) show how information can be
organized; their field names are proposals, not an implemented schema.

## Requirements versus recommendations

- **Required** means information or behavior needed to accept a publication under
  this proposed convention. A requirement applies only where relevant to the
  chosen data type. It is not a new runtime rejection rule for legacy datasets.
- **Recommended** means a preferred practice. An alternative can be documented
  and agreed during integration.
- **Optional** means useful additional metadata or a presentation suggestion.

Unanswered scientific questions should be recorded, not filled in by guessing.
Exploratory integration can start with incomplete information; operational
acceptance requires resolution of the applicable requirements.

## Responsibility split

| Producer publishes | App implements | Project/user chooses |
| --- | --- | --- |
| Quantities, source units, time meaning, coordinates, quality and missing values | Validated decoding, compatible unit conversions, reusable renderers | Display units and supported formatting preferences |
| Exact colors used to encode precolored images | Faithful legends and unit-equivalent labels | Layer visibility and map layout |
| Feature IDs, relationships, actual availability, revisions | Joins, selectors, error handling, bookmarks | Project defaults and current selections |
| Recommended scientific groupings and styles | Accessible controls, popup layout, interactions | Available presentation alternatives |

A published dataset is not a map layer. One dataset may supply multiple layers
and popups, and a family may link several datasets. Producers need stable dataset
and feature identifiers, but do not need to choose internal map layer IDs.

## Existing standards

Use existing standards where they fit, without requiring producers to replace
all working formats:

- [GeoJSON (RFC 7946)](https://www.rfc-editor.org/rfc/rfc7946) defines geographic
  feature exchange, including longitude/latitude coordinates. Do not label
  projected coordinates as RFC 7946 GeoJSON.
- [PMTiles](https://docs.protomaps.com/pmtiles/) supports tiled archives fetched
  using HTTP range requests. Its storage metadata does not replace a scientific
  attribute dictionary.
- [STAC](https://stacspec.org/en/about/stac-spec/) provides catalogs, collections,
  items, and asset links. Existing STAC publications can be mapped to this
  contract; no STAC compliance is claimed for the examples here.
- [CF conventions](https://cfconventions.org/) provide established scientific
  terminology for quantities, units, coordinates, flags, and temporal methods.
  Use an applicable released version and verified standard names where possible.
  A CSV sidecar borrowing those concepts is not itself a CF-compliant NetCDF file.

This draft does not require a particular catalog technology, vocabulary version,
unit-conversion library, or directory tree. Those implementation choices should
be settled with pilot producers before publishing a machine-enforced schema.
