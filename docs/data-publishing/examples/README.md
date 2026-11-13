# Illustrative Publication Metadata

These are **syntactically valid JSON examples, not a finalized schema and not
manifests that the current app can automatically load**. URLs, values, identities
and scientific definitions are fictional. Do not apply their time intervals or
missing-value choices to a real product without producer confirmation.

- [Raster example](./raster-family.json): a sparse family listing one published
  model/member/variable/date combination with discrete PNG color meanings.
- [Feature-data example](./feature-data.json): station geometry and a daily CSV
  linked by feature ID, with source-unit and missing-value declarations.

They illustrate information placement, not an exhaustive list of required fields
for every dataset. Use the [common contract](../common-contract.md) and
[type-specific requirements](../common-types.md) to complete a real publication.
The [specialized examples](../specialized-data.md) link to existing implemented
contracts for encoded fields and 3D observations.

For the implemented Hydro Ops pilot profile and its limitations, see the
[raster publishing guide](../raster-families.md#current-adapter-boundary).
Do not copy these fictional examples as runtime manifests for that adapter.
