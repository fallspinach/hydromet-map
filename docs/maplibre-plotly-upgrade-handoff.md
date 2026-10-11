# MapLibre / Plotly upgrade handoff

Prepared 2026-10-10. Read this file, `AGENTS.md`, and the relevant project skill
before starting. This is the upgrade worktree; the user's working map remains
in the sibling `hydromet-map/` folder on `main`.

## Goal and scope

Upgrade MapLibre and Plotly to supported, compatible versions that address the
remaining dependency audit findings, while preserving map, plotting, and
bookmark behavior. The user deliberately finished OCWD Landsat 8 before this
migration and may continue adding features to `main` during upgrade work.

This preparation has NOT upgraded any dependency. Research current official
release notes, migration guides, wrapper peer dependencies, and advisories
before choosing exact target versions. Do not blindly run `npm audit fix --force`
or override Plotly's nested MapLibre version without compatibility evidence.
Prefer separate, reviewable MapLibre and Plotly commits with validation after
each. Avoid unrelated refactoring and dependency churn.

## Worktrees and recovery

- Working map: `/cw3e/mead/projects/cwp206/agentization/hydromet-map`, branch `main`.
- Upgrade work: `/cw3e/mead/projects/cwp206/agentization/hydromet-map-upgrade`,
  branch `upgrade/maplibre-plotly`.
- Stable checkpoint: `07020a7`, annotated tag `stable-before-maplibre-plotly`
  (pushed to GitHub).
- Remote: `origin`, `github.com:fallspinach/hydromet-map.git`.
- Each worktree has separate files, `node_modules`, and `dist`; Git history,
  refs, and remote settings are shared. The upgrade folder's `.git` is a file.
- Keep upgrade edits, installs, and builds in this folder. Do not switch or reset
  the sibling worktree, change its dependencies, or stop its development server.
- When needed, fetch and merge `origin/main` into this upgrade branch after
  committing local work. Avoid rewriting shared history. Merge upgrades into
  `main` only when the user is ready and validation is complete.
- The checkpoint tag remains available even as both branches advance; no reset
  of `main` is needed to keep using the working map.

## Starting the app

`npm ci` has already completed in this worktree. Use:

```bash
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Port 5173 is reserved for the working map. No upgrade dev server was left
running during preparation. For a remote machine, forward port 5174 as needed.

## Dependency and validation baseline

Installed from the committed lockfile with Node v24.21.0 and npm 11.19.0:

| Package | Installed version |
| --- | --- |
| maplibre-gl | 5.24.0 |
| plotly.js | 3.7.0 |
| Plotly's nested maplibre-gl | 4.7.1 |
| react-map-gl | 8.1.1 |
| react-plotly.js | 2.6.0 |
| vite | 8.3.4 |

Compatible dependency updates were committed in `9f1bfae`; Landsat and family
switching followed in `07020a7`. Package ranges are in `package.json`; exact
versions are in `package-lock.json`.

Fresh checks in this worktree, before any migration:

- `npm ci`: passed; lockfile unchanged.
- `npm run build`: passed. Existing warning about chunks over 500 kB;
  main JS approximately 7.13 MB / 2.05 MB gzip.
- `node --test tests/layer-families.test.mjs`: all 10 tests passed.
- `npm run lint`: already fails with 22 errors and 6 warnings. Existing issues
  include React effect/memoization checks, unused variables, refresh exports,
  and control-character regex rules. Record changes relative to this baseline;
  do not present these as new migration failures or claim a clean lint baseline.
- `npm audit --json`: two critical package findings, MapLibre and Plotly via
  MapLibre. Advisory: https://github.com/advisories/GHSA-jrc7-96c5-q579
  (DOM sanitizer bypass). Both direct and nested MapLibre copies are flagged.
  At preparation time npm suggested MapLibre 6.13.0 and Plotly 4.1.2, both major
  updates. These are audit suggestions, not vetted migration targets. Recheck
  advisories and versions when work starts. Do not claim application exploitability
  based solely on the package audit.
- `npm ci` reported an unapproved optional install-script review for
  `es5-ext@0.10.64`; installation and the build still passed. No script-approval
  configuration was changed.

## Architecture and important files

Read `README.md`, `docs/architecture.md`, `docs/projects.md`, `docs/layers.md`,
`docs/raster.md`, `docs/popups.md`, and `docs/state-and-bookmarks.md` as needed.
Use `.codex/skills/hydromet-map-config-workflow/SKILL.md` for map-related edits.

- React + Vite; map rendering uses `react-map-gl/maplibre` and MapLibre.
- `src/components/map/MapCanvas.jsx` owns map integration;
  `MapHud.jsx` owns controls; `MapLegend.jsx` owns raster legends.
- `src/config/mapConfig.js` defines projects and families;
  `src/layers/` registers renderers.
- `src/features/cnrfcPointPopup/TimeSeriesPlot.jsx` and
  `src/features/b120PointPopup/B120PointPopupTable.jsx` use the React Plotly
  factory and `plotly.js/dist/plotly`. Inspect actual trace types before changing
  bundles; plotting includes tables as well as time series.
- Custom 3D rendering: `src/features/arRecon3d/ArRecon3dLayer.jsx`.
- Custom particle rendering: `src/features/gfsIvtParticles/GfsIvtParticlesLayer.jsx`.
  Read `docs/particle-tracers.md` and the skill's particle-tracer reference before
  changing this renderer. AR Recon combines flight and IVT controls.
- `src/lib/appState.js` serializes bookmarks;
  `src/lib/projectFamilies.js` handles project-specific family switching.
- Existing global globe/terrain dragging issues are documented in
  `docs/known-issues.md`; distinguish them from upgrade regressions.

## Preserve the recently accepted Landsat behavior

OCWD offers CNRFC and Landsat families with project-level mutual exclusion.
Turning off CNRFC also disables dependent streamflow; independent static layers
remain available. Family selections and previously active dependent layers are
remembered. Other projects can reuse families independently.

Landsat manifest:
https://cw3e.ucsd.edu/hydro/ocwd/imgs/landsat8_web_maps/manifest.json

- NDMI and NDVI; skip observations with zero valid pixels; initially show latest
  nonempty date. Previous/next step through available observations only.
- Overlay opacity 0.7 for both variables; honor published image bounds/resampling.
- Standard vertical BrBG legend, ten sampled colors, boundaries from -1 to +1.
- Controls after the layer selector in the top row, wrapping on narrow screens.
  No visible family heading. Month/year dropdowns share a calendar row.
- Legend uses the same position as CNRFC's.
- Preserve old CNRFC bookmarks and new `fam` bookmarks; serialize only active,
  visible family state. All-off layer selections must remain all off.

## Migration validation and completion

1. Inspect actual MapLibre API/custom-renderer and Plotly trace usage; research
   current primary documentation. Choose compatible packages and wrappers.
2. Upgrade incrementally, with build and focused validation after each stage.
3. Exercise projects `ocwd`, `cnrfc`, `b120`, `yampa`, `global`, `cw3eObs`, and
   `arRecon`. Cover raster loading, layer toggles, basemap changes, terrain,
   globe/mercator, hover/click, and project switching.
4. Test AR Recon 3D flights and IVT particles, changing time and basemap,
   animation, and camera movement. A successful bundle alone is insufficient.
5. Test representative time-series popups and B120 tables: tabs, selectors,
   resize, zoom, exports, closing/reopening, and bookmark restoration.
6. Test both Landsat variables, available-date stepping, family exclusivity and
   streamflow restoration, legacy/new bookmarks, and desktop/mobile layouts.
7. Run the build, family tests, lint comparison, and audit again. Verify both
   MapLibre dependency paths. Report remaining issues without suppressing them.
8. Summarize exact versions, compatibility fixes, validation evidence, and any
   limitations before recommending merge into `main`.

`tools/snapshots/README.md` describes existing bookmark screenshot tooling.
For screenshots, set the base URL to port 5174. Chromium headless worked on this
machine with `--no-sandbox --use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader`. Prefer native rendering checks where available;
software-rendered browser checks do not establish all GPU behavior.

The user prefers autonomous progress and few approval prompts. Carry out
authorized, reversible upgrade work without repeatedly asking permission.
Keep communication concise and identify any actual blocker. This handoff
records context; it does not authorize publishing a deployment or prematurely
merging unfinished upgrades into the working map.
