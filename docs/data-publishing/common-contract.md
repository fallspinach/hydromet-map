# Common Publication Contract

Part of the [proposed publishing convention](./README.md). These requirements
concern the meaning and accessibility of data, independently of file format.

## Publication package

**Required:** publish a machine-readable description, normally JSON, with links
to its data and any referenced metadata. One dataset/product manifest can cover
many files. No manifest is required in every directory or beside every image.
Shared declarations may be referenced rather than copied. References must resolve
to a specific interpretation; contradictory definitions are validation errors.

**Recommended:** separate stable dataset metadata from a frequently updated
availability index when the listing is large. A small dataset can combine them.
Resolve relative asset paths against the document containing the path. Existing
directory layouts are acceptable. A URL template is a naming rule, not proof that
all combinations exist.

| Metadata | Required information |
| --- | --- |
| Identity | Stable dataset ID, title, scientific description, producer/contact, attribution and access/reuse terms |
| Version | Metadata convention/version, dataset or processing version, publication revision and update timestamp |
| Variables | Stable IDs, descriptions, quantities, source units, storage fields and decoding rules |
| Space | Horizontal reference, coordinate order, coverage, geometry/grid reference; vertical reference where applicable |
| Time | Calendar, time zone/offset, time coordinate meaning, sampling/aggregation intervals, initialization and valid times where applicable |
| Dimensions | IDs and labels for variables, sources/models, products, runs, members, levels or other selectors |
| Availability | Actual supported combinations, linked assets, known gaps and retention/overwrite behavior |
| Quality | Missing/invalid encodings, flags, valid ranges and meaning of empty/absent data |
| Relationships | Stable identifiers and rules for linking assets, features, geometries and time series |
| Transport | Format, compression, asset locations and browser access requirements |

Optional fields include thumbnails, suggested plot groups, recommended palettes
for numerical data, and links to methods papers. Scientific limitations affecting
interpretation are required, not merely optional help text.

## Quantities, units and decoding

**Required:** distinguish a quantity from its storage unit and display label.
For example, soil moisture can be water depth, volumetric fraction, or percentile
rank. These cannot all be converted to inches. Define whether a percentage uses
0–1 or 0–100, and whether a statistic is exceedance or non-exceedance probability.
A percentile rank remains dimensionless; a flow value at the 90th percentile
still has flow units and can be converted.

Use unambiguous machine unit identifiers alongside readable labels. Document
nonstandard units. Supply scale and offset for packed values with an explicit
formula and the order in which masks and missing sentinels are applied. If source
values are already physical measurements, declare that no packing is applied.
For temperature distinguish absolute temperature from a temperature difference;
only the former uses an offset in Celsius/Fahrenheit conversion.

The intended interpretation pipeline is:

1. Decode bytes/fields and identify missing or invalid source values.
2. Apply documented packing scale/offset to obtain physical values.
3. Apply any explicitly agreed scientific or display treatment.
4. Convert compatible physical units for display.
5. Format labels without changing the underlying values.

Never silently treat missing values as zero. Producers must explain whether a
negative value is a sentinel, a valid measurement, or an error. Hydromet Map's
current CNRFC precipitation-to-zero rule is a legacy display policy, not a
universal scientific rule or a requirement for other producers.

**Recommended:** retain original numerical values and masks. Unit switching
should derive from source/canonical values, not repeatedly convert displayed
numbers. A data download should state whether it contains original or converted
values; the existing raw-source download remains an original-file operation.

Physical validity bounds must declare units, boundary inclusion and validation
stage. Separate them from expected/climatological ranges and suggested plot
limits: an unusual value need not be invalid, and changing axis limits must not
mask data. Preserve invalid values' reasons and source flags; use the
[time-series validation workflow](./feature-time-series.md#variables-units-and-validation)
for explicit decoding and masking order.

## Time and statistical meaning

**Required where applicable:** distinguish observation/analysis time, forecast
initialization, valid time, lead time, publication time, and revision/update time.
Use explicit-offset ISO timestamps for instants. Date-only values are acceptable
when the manifest defines the interval, time zone, and whether the date labels
its start or end. Define inclusive/exclusive boundaries, accumulation versus
instantaneous/rate/mean values, resets of cumulative totals, and missing samples.
Do not infer a 24-hour UTC accumulation from a filename containing a date.

Declare the calendar. Non-Gregorian calendars require an agreed adapter; current
JavaScript date handling must not silently reinterpret them. State water-year
boundaries, climatology reference periods, smoothing windows, and leap-day
handling when those concepts appear in the product.

## Dimensions and availability

**Required:** identify valid combinations rather than imply a complete Cartesian
product. A deterministic product may have no ensemble axis; member IDs identify
realizations, while mean/median/percentiles are separate statistics. Describe
member provenance and weights if probabilities or weighted statistics are used.
Keep stable IDs separate from display names. Explicit asset listings, partitioned
indexes, or well-defined templates plus availability records are acceptable.

Describe the distinction between no observation, all-missing coverage, a failed
production run, a not-yet-published asset, and an expired asset. A job's success
status is not sufficient evidence that every requested file exists.

## Serving and updating files

**Required:** serve assets over HTTPS for an HTTPS map, with correct content types
and CORS access from the deployed map origin when cross-origin. If authentication
is required, agree an access path; credentials must not appear in public manifests.
Range-based formats require a working byte-range response, including correct
206/Content-Range behavior and relevant CORS-exposed headers. Verify this with the
actual consumer, not only a successful full-file download.

Declare whether gzip is part of the file format or HTTP transport encoding. The
current CSV loader explicitly decompresses `.csv.gz` bytes; avoid an HTTP setup
that makes the browser transparently decompress those bytes a second time before
that loader handles them. Byte-indexed assets must preserve the advertised byte
layout under the server's compression and caching behavior.

**Required:** publish complete referenced files before exposing a new index or
manifest revision. Replace the index atomically where hosting permits, or use an
equivalent release/pointer mechanism. Readers must not mix an old geometry/index
with incompatible new attribute files.

**Recommended:** immutable run/revision URLs, with a separately refreshed latest
pointer; cache validators for mutable indexes; checksums and sizes for large
assets; documented retention and withdrawal policies. Existing overwritten URLs
may continue during transition, but their reproducibility limitation must be
explicit. A bookmark to a date cannot recover an old forecast run that no longer
exists.
