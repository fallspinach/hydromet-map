# Fictional SWE Collection

A small, self-contained publishing example for the
[feature time-series guide](../../feature-time-series.md). This is not CDEC data,
not an approved CDEC interpretation, and not a manifest the app can currently
load automatically. Field names are proposed, not a finalized schema.

- [collection.json](./collection.json): metadata, variable/quality rules and inventory.
- [features.geojson](./features.geojson): one fictional point with string ID `00123`.
- [00123.csv](./00123.csv): six daily instantaneous observations in mm.
- [expected.json](./expected.json): expected interpreted values and inches conversion.

All timestamps are explicitly 12:00 UTC. This is a fictional snapshot convention,
not a daily average. Confirm the actual source convention for a real publication.

| Input | Expected interpretation |
| --- | --- |
| 0, good | Valid zero SWE; 0 inches |
| 25.4, provisional | Retain with flag; 1 inch |
| Blank, missing | Missing; never convert to zero |
| -9999, missing | Raw sentinel; mask before conversion |
| -1, good | Flag alone does not override physical validity; mask negative SWE |
| 50.8, suspect | Mask according to this example's explicit quality policy |

The raw values and flags remain in the source CSV. `nativeMm` in expected.json
means the interpreted, accepted native value, not an overwrite of the raw column.
A masked value remains null in every display unit. Connecting a line across these
missing samples would require an explicit policy; it is disabled in this example.

For a real pilot, also supply extreme-but-valid and irregular cases, duplicates,
partition boundaries, and relevant local-time or leap-day examples. Model,
forecast and climatology sources need their own provenance and temporal metadata;
this small example intentionally contains observations only.
