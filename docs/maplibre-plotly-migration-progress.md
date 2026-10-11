# MapLibre / Plotly migration progress

Started 2026-10-11 on `upgrade/maplibre-plotly`. The sibling `main` worktree
and its server are unchanged. These are initial migration commits, not a
recommendation to merge; the handoff's full interactive acceptance checks
remain required.

## Dependency changes

| Package | Before | Installed after migration |
| --- | --- | --- |
| maplibre-gl | 5.24.0 | 6.13.0 |
| react-map-gl | 8.1.1 | 8.1.3 |
| @vis.gl/react-maplibre | 8.1.1 | 8.1.3 |
| plotly.js | 3.7.0 | 4.1.2 |
| Plotly's nested maplibre-gl | 4.7.1 | 6.11.2 |
| react-plotly.js | 2.6.0 | 2.6.0 (retained) |

The manifest retains the repository's caret-range convention; the lockfile
records exact versions. No overrides or forced audit fixes were used.

## Compatibility decisions

- MapLibre 6 uses ESM and requires WebGL2. Replaced the two default imports
  with named/namespace imports. `src/main.jsx` supplies a Vite `?url` import
  to `setWorkerUrl`, so production builds emit a hashed worker asset.
  See the [official v5-to-v6 migration guide](https://github.com/maplibre/maplibre-gl-js/blob/v6.0.0/docs/guides/v5-to-v6-migration-guide.md)
  and [v6 release notes](https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.0.0).
- The old React map wrapper accesses the removed `map.transform` internals.
  Upgraded the wrapper instead of adding an application shim. Upstream added
  MapLibre 6 support in 8.1.2; 8.1.3 also includes a terrain guard.
  See [wrapper release notes](https://github.com/visgl/react-map-gl/releases).
- AR Recon and IVT use `defaultProjectionData.mainMatrix`; their render
  callbacks were retained. IVT already uses GLSL ES 3.00. Their full animation,
  camera, time-change, and style-restoration checks remain acceptance work.
- Inspected Plotly usage: scatter, bar, table, and geographic choropleth traces.
  Kept the full Plotly distribution and existing React factory integration.
  The app does not use the removed Mapbox trace types. The retained wrapper's
  published peers (`plotly.js >1.34.0`, `react >0.13.0`) admit these versions;
  browser checks provide additional evidence, not proof of every interaction.
  See [Plotly 4 release notes](https://github.com/plotly/plotly.js/releases/tag/v4.0.0)
  and [4.1.2 release notes](https://github.com/plotly/plotly.js/releases/tag/v4.1.2).
- Both installed MapLibre paths exceed the advisory's fixed version, 6.4.1.
  See [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579).
  This records dependency remediation, not an application exploitability finding.

## Validation so far

- After each dependency stage: `npm run build` and
  `node --test tests/layer-families.test.mjs` passed (10/10 tests).
- Final `npm audit --json`: zero vulnerabilities. `npm ls` confirms both
  MapLibre copies and no invalid peer dependencies in the inspected tree.
- Final `npm run lint` output exactly matches the pre-migration run:
  22 errors and 6 warnings. Existing lint issues were not changed.
- Production build: main JS 7,223.93 kB / 2,110.08 kB gzip; separate MapLibre
  worker 508.31 kB. The existing chunk-size warning remains.
- Development browser: OCWD loaded with WebGL2, 68 style layers, and no
  page or console errors.
- Production preview on port 5174: OCWD loaded; NDVI/NDMI selection and
  previous/next observation controls worked. Inspected the 390-pixel viewport
  screenshot: controls wrap and the NDMI overlay and legend are visible.
  Globe switching and a change to the terrain basemap completed
  with `map.loaded() === true` and no page/console errors. A subsequent desktop
  screenshot stalled in software rendering, so this is not a complete visual pass.
- Production B120 AMF bookmark (`nrt-fcst`, update `2026-04-14`, `cdfm`)
  restored a plot. Switched to Table and Summary Map: table values and both
  choropleths rendered; inspected the Summary Map screenshot. At viewport width
  600, the choropleth widths changed from about 514 to 264 pixels. No page or
  console errors were recorded. This does not establish popup positioning or
  usability on all mobile sizes.
- Additional production checks with flat basemap and terrain disabled: CNRFC,
  B120, Yampa, and CW3E observations reached `map.loaded() === true` and switched to globe with
  no recorded page/console errors. The sequential browser run stalled during
  the global project check and was stopped. Global remains unverified; no
  baseline comparison has established whether this is an upgrade regression,
  a remote-resource issue, or a software-rendering limitation.
- A separate run passed CW3E observations but did not complete AR Recon's
  custom-layer checks and was stopped. AR Recon/IVT remain unverified.
  Both stalled runs need isolated reproduction and a pre-upgrade comparison;
  absence of an exception in the partial logs does not establish a pass.

Browser checks use Playwright Chromium with `--no-sandbox --use-gl=angle
--use-angle=swiftshader --enable-unsafe-swiftshader`. Local scripts, screenshots,
and reports are under ignored `tools/snapshots/output/migration/`.
Temporary browser processes and the upgrade preview server were stopped.

## Remaining acceptance work

### Browser feedback and IVT basemap fix

The user subsequently tested Global and AR Recon in an interactive browser,
including animation, time changes, camera movement, basemap switches, popups,
hover, projection, and terrain, and initially found no obvious problems.
Repeating the suggested Global/AR Recon sequences also caused no crash.
The earlier automated stalls are inconclusive automation results, not confirmed
application freezes; their final logs include errors caused by terminating the
test browsers.

A later user report identified a separate reproducible issue: IVT particles
disappear on Flat/Terrain → Satellite. Instrumented browser testing confirmed
that the custom layer survives a style diff but falls beneath the newly inserted
Satellite imagery (IVT index 0, Satellite index 1). The previous handler returned
when IVT already existed and never repaired its order; its `isStyleLoaded()` guard
also blocked restoration while imagery was loading.

The handler now restores IVT above the basemap and below the AR Recon flight
layer, using `getLayersOrder()` to include custom layers. Flight-layer ordering
uses that API as well, avoiding repeated moves based on `getStyle().layers`,
which excludes custom layers. Restoration no longer waits for tile loading.

The browser order checks pass for all six directed transitions among Flat,
Terrain, and Satellite. Build and all 10 existing family/bookmark tests pass;
lint remains at 22 errors and 6 warnings. A software-rendered screenshot attempt
timed out, so native-browser visual confirmation of this fix remains pending.

### Other acceptance checks

Complete the project matrix and interaction checks in
[`maplibre-plotly-upgrade-handoff.md`](./maplibre-plotly-upgrade-handoff.md),
especially native-GPU custom rendering, flight/IVT animation and style reloads,
hover/click, terrain, in-app project switching, popup zoom/export/close/reopen,
and full desktop/mobile family and bookmark restoration. Keep known globe
dragging issues distinct from new regressions. No merge or deployment has
been performed.
