# Coordinated Transition and Acceptance

This [draft convention](./README.md) is intended to travel with the data-production
team. It does not move data production into the map repository or require a
simultaneous rewrite of all producers.

## Suggested transition

1. **Agree the scope.** Identify the producer, scientific reviewer, map maintainer,
   publication type, consumers and current URLs. Record open questions.
2. **Describe existing outputs.** Add sidecar metadata and an availability index
   alongside existing data. Keep directory and filename conventions where useful.
3. **Confirm interpretation.** Resolve units, interval meanings, sentinels, color
   mappings, statistics and joins against representative files and producer intent.
4. **Pilot an adapter.** The map team implements only the needed reader/presentation
   changes. Compare the new interpretation with the existing map and producer
   reference values. Publishing the draft JSON alone does not enable it in the app.
5. **Publish and verify a release.** Upload assets first, then publish their index.
   Test access from the deployed map, including compression, CORS and byte ranges.
6. **Transition consumers.** Keep old URLs/metadata during an agreed overlap,
   document differences, retain rollback assets, and announce retirement dates.
7. **Stabilize the specification.** Reconcile pilot feedback, freeze field names,
   publish a JSON Schema and validator, and version future breaking changes.

The CNRFC/UCRB PNG pilots now have a dedicated
[raster handoff guide](./raster-families.md). Keep their test projects separate
from existing projects until scientific and application acceptance are complete.

Additional pilot coverage: CNRFC ensemble CSV publications, OCWD Landsat's
existing manifest, and a geometry-plus-attribute streamflow dataset. Together
these exercise unit conversion, color semantics, sparse dimensions and joins.
Specialized datasets can proceed through their own extension review in parallel.

## Producer handoff checklist

- [ ] Dataset description, responsible contact, attribution and reuse terms.
- [ ] Chosen common profile, or a specialized-data proposal.
- [ ] Manifest and sample URLs with explicit format/compression.
- [ ] Quantity/unit/field dictionary, missing and quality rules.
- [ ] Spatial and temporal references, interval definitions, forecast/statistic meanings.
- [ ] Actual availability, member lists and unsupported combinations.
- [ ] Geometry/index/attribute relationships and compatible versions.
- [ ] Exact precolored-image mapping, including boundary and missing colors.
- [ ] Publication cadence, revision/retention policy and release procedure.
- [ ] Reference values/images and ordinary, extreme, quiet and missing-data samples.
- [ ] Documented gaps or exceptions needing joint decisions.

## Acceptance checks

| Check | Evidence to retain |
| --- | --- |
| Metadata and links | Valid JSON, resolvable references, consistent IDs/units and known required fields |
| Files and schema | Expected columns, dimensions, dtypes, masks, time ordering and declared encodings |
| Scientific interpretation | Producer-confirmed decoded values, time intervals, units, categories, statistics and missing behavior |
| Raster colors | Boundary samples plus under/over/missing cases match the published mapping; coordinate placement agrees with reference |
| Relationships | Known feature IDs retrieve the right records; unmatched/duplicate IDs are handled explicitly |
| Availability | Selectors expose only published combinations and explain unavailable/expired assets |
| Serving | Browser-origin access, correct MIME/compression and working range reads where needed |
| Updates | Complete consistent revision visible after publication; no mixed geometry/index/data release |
| Presentation | Units and labels agree across plots, legends and hover; percentile ranks remain unchanged |
| Performance | Representative file sizes, startup/selection latency and mobile/browser memory behavior recorded |
| Compatibility | Existing URLs/bookmarks and legacy integrations behave as agreed during the overlap |

JSON Schema can check structure, but cannot prove scientific correctness, color
agreement or a valid join. Automated semantic/file checks and human scientific
review are also needed. This documentation change supplies neither a universal
runtime reader nor a machine-enforced schema/validator.

## Review decisions to record before v1

- Exact schema vocabulary and supported quantity/unit identifiers.
- Which existing standard metadata can be consumed directly versus through adapters.
- Required availability granularity and large-index partitioning.
- Supported field layouts/encodings and explicit extension handling.
- Treatment of legacy missing values and any approved display substitutions.
- Version compatibility, retention expectations and producer support arrangements.

Approval of a producer's scientific interpretation and acceptance of an app
adapter are separate responsibilities. Record both, including any limitations.
