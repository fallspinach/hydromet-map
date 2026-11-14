# Indexed Binary Feature Time Series

Specialized companion to the [feature time-series guide](./feature-time-series.md).
Use the same scientific contract for quantities, units, time, quality, provenance
and feature associations. Binary storage changes retrieval and decoding, not the
meaning of the data. CSV remains the preferred default for ordinary collections.

## When to use this profile

Large reach collections—tens of thousands to millions of features—may require
indexed binary access to avoid downloading/parsing the entire dataset for one
popup. Scale alone does not select a format: measure the access pattern and
latency with representative data. Agree the layout with the app maintainer before
producing a large archive. Existing specialized loaders are not universal readers.

## Required storage contract

- Container/format version, byte order, dtypes, array shapes and dimension order.
- Header layout, offsets, alignment and whether offsets refer to compressed or
  uncompressed bytes. Declare index base and any inclusive/exclusive ranges.
- Feature ID type and mapping to array positions. Preserve large integer IDs as
  exact strings or another agreed representation; do not lose precision in JavaScript.
- Explicit or generated time coordinates, calendar, interval semantics, leap-day
  handling and partitions. Identify runs, members and variables independently.
- Packing formula, missing codes, NaN handling, masks, flag layout, validation stage
  and physical units. Mask sentinels before scaling.
- Geometry/index/data compatibility identifiers and publication revisions.
- Partition addressing and actual availability, including absent features/times.

An array position is not a stable scientific feature ID. The index must resolve
the selected map feature unambiguously, even when tile geometry is generalized
or split. Specify behavior for missing and duplicate IDs.

## Retrieval and serving

Choose feature-major, time-major or chunked layout according to the expected
queries. A single feature's history should require a bounded amount of data, not
an accidental full-domain download. State minimum request units and estimated
transfer size for representative queries.

Range-based access requires verified HTTP 206/Content-Range behavior, appropriate
CORS/exposed headers and byte-exact payloads. Whole-file gzip generally prevents
arbitrary access by uncompressed offsets; use an agreed block/index scheme or
uncompressed range-addressable data. Do not apply transparent HTTP compression
that invalidates the advertised byte layout.

Publish data and indexes together through a consistent release mechanism. A
reader must not combine an old index with newly reordered features or time steps.
Use immutable revision URLs and retain enough metadata to reproduce a query.

## Acceptance evidence

Provide a small binary fixture, its index and a readable reference table with
expected decoded values. Include first/last features and time steps, partition
boundaries, missing/invalid codes, nontrivial scale/offset, and any ensemble axes.

Validate decoding independently of the producer, then compare real browser range
responses with full-file reference bytes. Verify feature joins, timestamp
alignment, physical values, quality state and display-unit conversion. Record
requests/bytes/time for a realistic popup query and failure behavior for mismatched
revisions. A successful download alone is not proof of a correct binary layout.

This is an integration checklist, not a mandated new binary file format or an
implemented generic adapter. Consult the [specialized integration process](./specialized-data.md)
for new layouts.
