# Publishing Feature-Associated Time Series

Producer guide, draft — 2026-11-14. Applies to observations, model estimates,
retrospective simulations, forecasts and derived statistics associated with
points, lines or polygons. Read with the [common contract](./common-contract.md).
This is a proposed information contract, not an implemented universal loader or
finalized JSON Schema. Production remains outside the map application's scope.

## Start with a small self-described collection

**Recommended:** UTF-8 CSV plus JSON metadata, a feature dataset and an explicit
asset inventory. CSV is the preferred general-purpose interchange format.
Plotly does not prescribe a file format: the app decodes published data and
constructs its own traces, axes and interactions. Do not publish Plotly objects
as the scientific data contract.

A simple JSON table/record format is an optional alternative when it has a clear
benefit. Agree its layout and adapter, use null for missing values, and declare
the same scientific information. Producers do not need to publish both formats.

Very large river collections have different retrieval needs. Use the separate
[indexed-binary guide](./indexed-feature-time-series.md) for those cases; do not
make ordinary station and basin publishers implement byte offsets or indexes.

Start with a few representative features and dates, including zero, missing,
invalid, irregular and extreme-but-valid values. A CDEC snow-pillow SWE pilot is
a useful candidate, but its actual units, time conventions and quality rules
must be confirmed by the producer. The [SWE example](./examples/feature-time-series/README.md)
is fictional and does not assert CDEC's conventions.

## Package and ownership

A collection may reference an existing geometry publication rather than copying
it. Shared metadata can be split across files or embedded in a small manifest.
No metadata file is needed beside every CSV.

```text
release-id/
  collection.json
  variables.json             # optional separate dictionary
  features.geojson           # or a reference to existing geometry/tiles
  availability.json          # optional separate inventory
  data/feature-id/year.csv
  README.txt
  acceptance.json
```

| Component | Required meaning |
| --- | --- |
| Collection | Stable ID, title, description, producer/contact, attribution, reuse terms, convention and processing versions, revision/update time |
| Features | Geometry reference/version, CRS, coordinate order, feature ID field and type, attribute definitions |
| Variables | Stable IDs, full labels, quantities, native units, source columns, decoding, time/statistical interpretation and quality rules |
| Series/assets | Actual feature/variable/product/run/member coverage, URLs, formats, partitions and join rules |
| Time | Calendar, zone/offset, timestamp meaning, intervals, aggregation and completeness rules |
| Provenance | Observation network/sensor or model/processing identity, input lineage and relevant caveats |

The producer owns scientific interpretation and data quality policy. The app owns
format decoding, validated joins, shared display conversion, Plotly configuration,
layout and interactions. Project/user preferences own display units and selections.
Optional `shortLabel` and suggested compatible plot groups help presentation;
they do not prescribe CSS, axis IDs or Plotly code.

## Associate values with features precisely

**Required:** declare the stable feature key and its representation. Preserve IDs
such as `00123` as strings. Do not rely on row order, station names, coordinate
rounding, or tile-local feature positions for joins. Specify whether the feature
ID is in each record or supplied by an asset's metadata, and how unknown or
duplicate feature IDs are handled.

Declare spatial support independently of geometry type:

- Point observation at a station, or model estimate sampled from a specified
  grid cell/interpolation at that station.
- Routed discharge at a reach outlet, reach average, or another reach quantity.
- Basin mean, basin-integrated volume, local runoff generation or routed flow.

A basin outline does not imply area averaging. A model trace displayed at a
station is not automatically a measurement of the same spatial support. Record
sensor height/depth, vertical datum and aggregation/weighting where relevant.
Describe relocations, reach-network revisions and catchment changes; version the
geometry or use effective dates where those changes affect interpretation.

## Describe each series and its source

A variable ID identifies the quantity/definition, not an entire series. Series
identity may also depend on feature, source/model, product, initialization,
member, level, statistic and time resolution. Explicitly declare the record key
so repeated valid times from different forecast runs are not mistaken for duplicates.

For observations, publish network/sensor provenance and provisional/reviewed
status where available. For model estimates, publish model and configuration
version, forcing/processing provenance and relevant known limitations. Distinguish
analyses, hindcasts and forecasts; do not label every non-observation as a forecast.

For forecasts, distinguish initialization, issue/publication, valid time and lead
time. State whether accumulation resets each run, and whether values represent
an interval amount, a rate, or a cumulative total. Enumerate members and separate
realizations from statistics such as mean or quantiles. Include member weights
when consumers are expected to compute weighted probabilities.

Retro/NRT histories may share a preferred timeline if the producer defines
precedence and actual availability. Keep stream provenance and revision identity;
never silently merge incompatible quantities or discard overlapping forecast runs.

### Explicit ensemble dimensions

For ensemble products, publish stable member IDs and readable labels, source/model
provenance, and control-versus-perturbed status where known. Declare how each ID
maps to records: a member column, a per-member asset, or an explicitly described
wide-column pattern. For example, these proposed fields describe a fictional
subset, not the full WWRF-Ens collection:

```json
{
  "members": [
    { "id": "ecm000", "label": "ECMWF member 000", "source": "ECMWF" },
    { "id": "gefs000", "label": "GEFS member 000", "source": "GEFS" }
  ],
  "columnMapping": {
    "variable": "runoff",
    "pattern": "RUNOFF_{member}",
    "memberPlaceholder": "members[].id"
  }
}
```

The producer must confirm actual IDs and provenance; an ID ending in 000 does
not by itself establish control-member status. Enumerate all members of the real
collection, and publish actual feature/run/variable/member availability rather
than implying every combination exists. Declare weights and their normalization
when weighted probabilities or summaries are intended; do not infer equal weights
across different contributing sources.

A typical long-table record key is feature ID, variable ID, initialization,
member ID and valid time, with additional dimensions where needed. Deterministic
products can omit the member axis. Mean, median and percentile summaries belong
to a statistic dimension and must not masquerade as realizations. Scientific
metadata describes members independently of whether the app displays one member,
all traces or an agreed summary.

## Variables, units and validation

**Required:** separate quantity, native physical unit, stored encoding and display
label. Include source-column mappings and definitions, not just abbreviations.
For example, SWE is water-equivalent depth, not snow depth; soil moisture can be
volumetric fraction, column storage or a dimensionless rank.

Use documented machine-unit identifiers and aliases. Include full `label` and,
optionally, compact `shortLabel`. Distinguish absolute temperature from a temperature
difference and percentile rank from a physical value at a percentile. Declare
0–1 versus 0–100 numerical scales explicitly.

### Validity ranges are not plot limits

**Required where known:** declare physical validity rules per variable, their units,
inclusive/exclusive boundaries, validation stage and handling of violations. If
there is no defensible bound, say so; do not invent a universal maximum.

Keep these concepts separate:

| Rule | Purpose | Typical action |
| --- | --- | --- |
| Physically valid range | Reject impossible values under the defined quantity/sign convention | Mask invalid value and retain reason |
| Expected or climatological range | Identify unusual but potentially real conditions | Flag for review; retain unless an explicit policy excludes it |
| Suggested plot limits | Set initial presentation | Never alter source validity |

For precipitation depth, a producer may declare minimum 0, inclusive, in mm,
applied after unpacking, with negative values masked. Missing or invalid rainfall
must not silently become zero. Negative temperatures can be valid; signed discharge
can represent reverse flow. Do not impose a shared nonnegative rule on all columns.
SWE suppression for a derived rank is distinct from missing source SWE.

Use structured bounds where possible, for example (illustrative field names):

```json
{
  "validRange": {
    "minimum": 0,
    "includeMinimum": true,
    "maximum": null,
    "unit": "mm",
    "stage": "decoded-physical-value",
    "onViolation": "mask-and-retain-reason"
  }
}
```

### Explicit interpretation order

1. Parse timestamps, IDs and values using the declared types; recognize raw missing
   tokens before numeric conversion. An empty field must not become numeric zero.
2. Decode source flags; apply the producer's documented exclusion rules. A
   provisional flag need not exclude a value. Preserve flags and reasons.
3. Unpack valid stored numbers with the declared scale/offset formula, if any.
4. Apply physical validity rules and documented derivations in their stated order.
   Validate derived quantities too when needed. Never turn a sentinel into a
   plausible measurement by scaling it first.
5. Retain valid native/decoded values and missing/quality state. Derive display
   values in the selected units; do not repeatedly convert previously converted values.
6. Format Plotly traces, hover labels, axes and exports according to their declared
   presentation policy. Preserve gaps unless an explicit interpolation policy applies.

Quality metadata must explain flags, including unknown flags, whether multiple
flags can coexist and which flags exclude data. Distinguish absence of a record,
an explicit missing value, invalid value, unavailable forecast and expired asset.
Masking for display should not destroy the original value or its provenance.

## Timestamp and aggregation contract

**Required:** name time columns, formats, calendar, time zone/offset and semantic
role. Prefer explicit-offset ISO timestamps for instants. Date-only values need
an explicit definition; do not treat them as UTC midnight by default.

For local daily products, state whether the zone follows daylight saving or is
fixed standard time, and how ambiguous/nonexistent local times are resolved.
Local calendar days may not be 24 hours. Avoid parsing date-only observations in
the browser's local zone when their scientific date is fixed by the producer.

For interval data declare start/end, closure, labeling, aggregation method and
sample weighting. State whether a daily SWE value is a snapshot, a mean or another
statistic; "daily" describes neither by itself. Specify required samples, missing
sample propagation, partial-interval policy and timestamp alignment. Define
cumulative totals and their resets before proposing conversions to interval amounts.

Declare chronological ordering and duplicate policy for the complete record key.
Do not silently choose whichever duplicate arrived last. State expected cadence
and irregular sampling; distinguish scheduled-but-missing samples from times when
no observation was scheduled. Do not interpolate across long gaps by default.

## CSV profile

**Recommended default:** UTF-8, comma delimiter, one header row, decimal point,
ISO timestamps and chronological records. Explicitly declare deviations.

**Required metadata:** delimiter/quoting, header presence, text encoding, column
names and types, numeric conventions, missing tokens, time columns, feature key,
series dimensions, row order and duplicate policy. Specify whether blank fields,
NaN strings and sentinels mean missing; CSV has no universal missing-value token.

Both common layouts are acceptable:

- Wide: one record per feature/time/run/member, with named variable columns.
  A per-feature file may obtain the feature ID from asset metadata.
- Long: records carry variable ID and value, with other dimensions explicitly
  represented. The complete key includes variable ID.

For wide ensemble columns, enumerate member IDs and publish the column mapping or
pattern. Never infer members or statistics solely from a filename/column suffix.
Declare quality columns and their relationship to value columns.

Gzip is optional. Declare file compression separately from HTTP Content-Encoding.
If the client decompresses a .csv.gz file itself, the server must not cause a
second decompression through transport configuration. Test the actual browser path.

## Climatology and other derived series

Publish observations, model estimates and reference curves as distinguishable
series, with explicit relationships. A seasonal curve indexed by month/day or
water-year day is not an ordinary dated observation. Declare its coordinate,
water-year start, leap-day policy and how it aligns to a displayed year.

Include reference period, statistic/quantile definition, estimator, sample counts,
minimum completeness, smoothing windows and source version. Explain whether a
quantile is a value (convertible SWE depth) or a rank (dimensionless). Convert
compatible observations, model estimates and physical-value reference bands
consistently when display units change.

## Availability, performance and revisions

Publish actual feature/series coverage, gaps and supported dimension combinations.
URL templates alone do not establish availability. An inventory can be partitioned
by feature group/time; each partition needs unambiguous bounds and references.

**Recommended:** retrieve only the selected feature and requested window. Use
per-feature files and/or year/water-year partitions as appropriate, with links to
full archives. Define partition boundary closure and duplicate rules so concatenation
does not lose or repeat samples. File-per-station is not mandatory when batching
is more efficient. Measure transfer, parsing and plotting costs separately.

Publish complete assets before indexes. Use immutable revisions or explicitly
state overwrite/reproducibility limits, retention, update cadence, late corrections
and how a reader detects a changed asset. Checksums and sizes support validation.
Keep geometry, variable dictionaries, indexes and time series revision-compatible.
Original downloads retain source units; any converted export must state its units
and processing. Do not change units at an existing URL without a breaking revision.

## Producer handoff and acceptance

- [ ] Manifest identifies producer, contact, terms, revision and processing/source provenance.
- [ ] Representative features and series join by stable typed IDs.
- [ ] Variable dictionary covers units, decoding, quality flags and validity ranges.
- [ ] Time semantics, aggregation/completeness and full record keys are explicit.
- [ ] Inventory lists real assets, supported dimensions, partitions and gaps.
- [ ] Reference records include expected decoded values, flags and masked results.
- [ ] Checks cover zero, missing tokens, invalid values, extreme valid values,
      duplicates, partition boundaries, and time-zone/leap cases where applicable.
- [ ] Forecast/member and climatology cases are checked when included.
- [ ] Hosted files have correct MIME/CORS/compression and match the local release.
- [ ] A scientific reviewer confirms interpretation and spatial/temporal support.
- [ ] The map maintainer verifies plots, gaps, joins, bookmarks, unit conversion,
      downloads, performance and mobile behavior in a separate test integration.

For the SWE pilot, confirm actual CDEC conventions before export, start with
observations, then add model comparisons and climatology as separately described
sources. A useful conversion check is 25.4 mm = 1 inch, with missing values and
flags unchanged. Unit switching must also update axes, hover and physical-value
bands; it must not convert percentile ranks or mutate native arrays.

The existing snow popup currently carries source URLs, unit conversions and
climatology-date logic in application configuration. The proposed collection would
move those scientific declarations into producer metadata, but a new adapter and
shared presentation-unit support still need implementation. Publishing this guide
or example does not automatically enable ingestion or metric/customary switching.
