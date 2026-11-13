# Publishing Raster Families

Producer guide, revised 2026-11-13 after the CNRFC/UCRB publication pilots.
Read with the [common contract](./common-contract.md) and
[raster requirements](./common-types.md#raster-families).

The pilots progressed from a small representative sample to a continuous
Retro/NRT collection. The largest improvements came from explicit scientific
metadata, exact color agreement, and availability records—not a particular
folder naming scheme. Start with a small, fully described sample before
regenerating a large archive.

## Choose the scope before producing images

Agree which domains, variables, time resolutions, products, streams, runs and
members the first release will contain. Distinguish:

- A representative sample: listed dates only, with no implied continuous archive.
- A continuous collection: expected intervals are declared and gaps enumerated.
- An operational publication: update, revision, retention and support policies
  are also agreed.

A test collection does not need every future variable or forecast product.
Label it as evaluation-only when appropriate. A successful automated export
is not equivalent to scientific review or browser acceptance.

## A practical package layout

The following layout worked for domains sharing variable definitions and legends:

```text
release-id/
  catalog.json
  variables.json
  legends.json
  README.txt
  acceptance.json
  cnrfc/
    family.json
    availability.json
    timeline.json
    coverage.json
    images/...
  ucrb/
    family.json
    availability.json
    timeline.json
    coverage.json
    images/...
```

These filenames and the split across files are recommended, not universal
requirements. A small publication can combine documents. Shared definitions
should be referenced rather than copied.

| Document | Responsibility |
| --- | --- |
| Catalog | Discover families and identify the release |
| Variables | Authoritative quantities, units, labels, aggregation, quality rules and statistical methods |
| Legends | Exact numerical-value/rank-to-RGBA mapping |
| Family | Identity, domain, image geometry, supported dimensions, provenance and metadata links |
| Availability | Authoritative assets and their actual dimension combinations |
| Timeline | Optional producer-selected preferred asset for each logical interval |
| Coverage | Derived coverage summaries and explained gaps/incomplete intervals |
| Acceptance | Checks performed, results, review status and remaining limitations |
| README | Entry point, what to transfer, evaluation restrictions and release instructions |

Resolve relative links against the document containing them. Mark production
source paths as provenance-only identifiers with a declared root; they must not
look like required browser downloads. Internal job plans and build shards need
not be deployed. Clearly label synthetic fixtures and keep them out of the
scientific catalog and timelines.

## Variable definitions: describe the science once

**Required information:** stable ID, full label/description, physical quantity,
units, temporal meaning, missing/invalid treatment and relevant processing.
Keep the shared variable dictionary authoritative. Avoid a second family-level
copy of statistical rules that can drift out of sync.

**Recommended:** add an optional `shortLabel` for compact selectors. Retain the
full `label` for tooltips and scientific descriptions. Suggested pilot labels:

| ID | Full meaning | shortLabel |
| --- | --- | --- |
| precipitation | Daily precipitation depth | Daily P |
| temperature | Daily mean air temperature | Daily T |
| soil_water_percentile | Daily column soil-water percentile rank | Daily SM %-ile |
| swe_percentile | Daily mean SWE percentile rank | Daily SWE %-ile |
| precipitation_percentile | Monthly mean precipitation-rate percentile rank | Monthly P %-ile |
| temperature_percentile | Monthly mean temperature percentile rank | Monthly T %-ile |

These are suggestions, not reserved variable IDs or universal definitions.
For example, the pilot soil-water rank concerns storage over the upper 2 m;
another dataset might describe a different depth or volumetric fraction.
Producers supply concise scientific names; the app owns control placement,
icons, responsive layout, tooltips and accessibility. Test the longest label
on a narrow screen. Do not encode UI widths or button positions in metadata.

### Units and numerical scales

Use one documented machine-unit vocabulary, with explicit aliases where needed
(e.g. `Cel` and `degC`). Separate machine units from display labels.

Percentile ranks require an explicit numerical convention. A rank stored as 95
on a 0–100 scale is already ready for a label such as 95%; it must not be
multiplied by 100. Declare the numerical range and the legend threshold scale
with numeric fields, not only a prose string. Percentile ranks are dimensionless;
the physical value at a specified percentile still has physical units.

Display-conversion suggestions are optional. The app should apply its shared
unit rules, leave source values unchanged, and convert legend thresholds without
changing precolored image bins. Distinguish source field units from derived
quantity units: mean rainfall rate and accumulated precipitation depth are not
the same quantity.

### Aggregation and completeness

Specify both the interval and the statistic inside it:

- Start/end timestamps, boundary closure, calendar, time zone and date label.
- Mean, accumulation, snapshot or percentile of an explicitly defined aggregate.
- Which source timestamps contribute. Interval-end hourly records 01:00 through
  the following 00:00 differ from grouping records by their timestamp date.
- Required sample counts, weighting, missing-cell propagation and treatment of
  incomplete intervals. Distinguish aggregate completeness from climatology
  sample requirements.

For derived percentiles, document reference period, estimator, inversion and
interpolation, ties, tail clipping, moving-window alignment, leap days, minimum
samples and suppression thresholds. Identify the actual climatology tables by
checksum or durable version; scheduler job IDs alone are insufficient provenance.

The pilot's 24-hour daily inputs, soil-layer weights and SWE cutoff are
producer-specific scientific choices, not requirements for other datasets.

## Colors, geometry and invisible images

**Required:** publish the exact RGBA mapping used to make the images. For
classified maps, include bin boundaries and inclusion rules, under/over-range
behavior, missing values, background and intentionally transparent classes.
A palette name alone is insufficient. Check decoded pixels, not just the
palette entries: indexed PNG palettes may contain unused padding colors.

Declare pixel projection, dimensions, footprint and corner order, outer-edge
versus pixel-center reference, row orientation, masking and resampling.
Geographic corner coordinates alone do not describe the internal projection.
Distinguish resampling during image production from recommended display
resampling. Nearest-neighbor display is appropriate for the pilot's discrete bins.

**Required:** distinguish a missing estimate from a valid value intentionally
hidden by the legend. Zero visible pixels does not prove that an image is empty
or unavailable. For example, a precipitation map can be entirely transparent
when all valid values are below its highlighting threshold.

**Recommended:** use one canonical transparent RGBA value and explicitly state
that alpha-zero pixels do not encode their quality category. The pilot uses
`#00000000` for all transparent pixels. Do not rely on RGB differences under
zero alpha surviving browser rendering.

Publish quality counts or an equivalent summary that distinguishes:

- Outside-domain pixels.
- Missing or invalid estimates inside the domain.
- Valid estimates whose statistic is suppressed or unavailable.
- Valid values intentionally hidden by the legend.
- Visible values.

State which categories are disjoint and which totals include other categories.
Keep source-cell counts separate from rendered-pixel counts; neither is
necessarily an area fraction. A state such as `valid_data_not_highlighted` can
help a consumer retain valid transparent assets. It does not require an on-map
message. Pixel-level quality queries require a separate mask or numerical
companion; aggregate counts cannot locate missing pixels.

## One timeline across Retro and NRT

For a continuous user-facing history, provide a single preferred timeline per
logical series. The asset records still identify their actual stream. The map
can then use one date selector without asking users to choose Retro or NRT.

**Required:** define the selection policy and resolve each interval to an actual
asset. Do not infer stream from a universal cutoff or filename. Cutoffs can
differ by variable, product, resolution or domain.

Both publication approaches are acceptable:

1. Publish only the selected asset for each interval, with exactly one stream.
2. Publish alternatives and explicitly identify the preferred asset.

When overlaps exist, the producer decides precedence; when neither stream has
an asset, report a gap. Keep IDs, quantity definitions, units, time aggregation
and color interpretation consistent across the combined series, or explicitly
declare changes that require consumer handling.

A timeline entry in the Hydro Ops pilot has this shape:

```json
{
  "product": "forcing",
  "variable": "precipitation",
  "resolution": "daily",
  "date": "2026-04-18",
  "preferredAsset": "example_nrt_precipitation_20260418",
  "availableAssets": ["example_nrt_precipitation_20260418"]
}
```

This fragment needs a matching availability record; it is not a standalone
manifest. Generate coverage summaries and timelines from the asset inventory
where possible. For monthly products, distinguish an unfinished current month
from an unexpectedly missing completed month. In a sparse sample, unrequested
dates are not production failures.

Forecast initialization, lead times, members and statistical summaries remain
separate dimensions. A Retro/NRT stitching policy must not silently collapse
forecast runs or ensemble members.

## Validate before handing over

Retain a concise report of the following checks:

1. JSON parses; required references, variable IDs and legend IDs resolve.
2. Asset IDs and full dimension tuples are unique; preferred assets exist and
   agree with their timeline entries. Coverage counts and gaps match inventory.
3. Actual files exist; checksums, PNG headers, dimensions and encodings agree.
4. Every decoded pixel color is allowed. Alpha conventions and visible counts
   agree with images; quality categories partition as documented.
5. Interval/date labels and continuous or sparse coverage match the declared
   scope. Check stream transitions separately for each series.
6. Producer reference calculations confirm units, aggregation, boundary values,
   statistics and masks. PNG checks alone do not prove scientific correctness.
7. Representative images align geographically with known reference features.
8. Hosted metadata and representative images match local files and work from the
   browser origin with correct MIME/CORS behavior.
9. The map team verifies selection, calendar navigation, stream transitions,
   legends, transparent images, bookmarks and mobile layout.

Include ordinary, extreme, quiet/transparent, missing, invalid and
statistic-unavailable cases, plus leap days and month/year boundaries where
relevant. Small labeled synthetic fixtures can exercise rare cases; record which
checks used fixtures rather than scientific observations.

## Release and test without disrupting existing layers

Publish complete assets before exposing the release metadata. Deploy shared
metadata and both family folders together, preserving relative paths. Use an
immutable revision-specific URL; a stable catalog may point to that release.
Replacing files at a stable family URL can mix revisions during loading and
prevents old bookmarks from identifying the earlier publication.

Use separate test projects/families while existing integrations remain active.
Record local validation, browser validation and scientific approval separately.
Resolve public contact and reuse terms before operational/public acceptance.
Migration is a later explicit decision, not a side effect of uploading a pilot.

## Current adapter boundary

The map's publication test projects implement `hydro-ops-raster-pilot`
`conventionVersion: "0.4"` through
[publicationRaster.js](../../src/lib/publicationRaster.js). Release names such as
v4 and v5 are dataset revisions, not necessarily convention-version changes.

The adapter reads a configured family URL and its variables, legends,
availability and preferred timeline. The catalog and coverage are useful handoff
metadata but are not currently used for automatic app registration. It supports
EPSG:3857 precolored PNG overlays, the agreed corner ordering, discrete bins,
and one product/resolution/legend per variable. It honors `shortLabel`, keeps
transparent assets and combines preferred streams across dates.

Additional forecast/member selectors, other projections or continuous color
mappings need an agreed adapter extension. Do not change scientific organization
to fit these temporary UI limits. The existing Landsat manifest has a different
adapter; neither implementation is a universal raster schema.

The adapter performs selected runtime checks, not the full acceptance procedure
above. A formal JSON Schema and standalone producer validator remain future
work; this guide does not claim that either has been implemented.
