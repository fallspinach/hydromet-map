# How To Add a Popup

This guide covers how to attach a popup window to a clickable vector or vector-tile layer and how to build tabbed Plotly time-series views inside it.

## 1. Choose the popup pattern

The app currently uses two main popup patterns:

- station-style popup family
  - one popup family usually belongs to one layer or one closely related group of layers
- shared popup rendered from `MapCanvas.jsx`
  - multiple layers populate `selectedStation`, but the popup component is mounted once

Examples:

- station popup family:
  - [src/features/cnrfcPointPopup/](../../src/features/cnrfcPointPopup/)
  - [src/features/b120PointPopup/](../../src/features/b120PointPopup/)
  - [src/features/yampaPointPopup/](../../src/features/yampaPointPopup/)
- shared popup rendered from `MapCanvas.jsx`:
  - [src/features/globalReachPopup/](../../src/features/globalReachPopup/)
  - [src/features/cnrfcStreamflowPopup/](../../src/features/cnrfcStreamflowPopup/)

Recommendation:

- if the popup belongs to one layer or one project-specific feature, create a dedicated popup family
- if multiple closely related layers should share the same popup logic, a shared popup can be reasonable

## 2. Create a popup feature folder

Under `src/features/`, create a folder such as:

- `src/features/myPopup/`

Recommended files:

- `myPopupConfig.js`
- `myPopupData.js`
- `MyPopup.jsx`

Typical responsibilities:

- config:
  tabs, plots, sources, series, axes, layout, CSV export config
- data:
  popup state creation, tab loading, source normalization
- component:
  popup UI, tabs, download button, plot rendering

## 3. Create popup config

The config file usually defines:

- popup width
- tab list
- plot definitions
- source definitions
- series definitions
- title builders

Examples:

- [src/features/cnrfcPointPopup/cnrfcPointPopupConfig.js](../../src/features/cnrfcPointPopup/cnrfcPointPopupConfig.js)
- [src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupConfig.js](../../src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupConfig.js)
- [src/features/globalReachPopup/globalReachPopupConfig.js](../../src/features/globalReachPopup/globalReachPopupConfig.js)

Typical tab shape:

```js
{
  id: 'history',
  label: 'Full History',
  plots: [
    {
      id: 'main',
      type: 'timeseries',
      sources: ...,
      series: ...,
      axes: ...,
      layout: ...,
      plotlyConfig: ...,
      csvDownload: ...,
    },
  ],
}
```

## 4. Create popup state and tab loading

The data file usually provides:

- `createInitial...PopupState()`
- `createSelected...PopupState()`
- `setActive...PopupTab()`
- `load...PopupTabData()`

These functions:

- store popup state in `selectedStation.popup`
- lazily load tab data
- normalize loaded source rows
- build Plotly-ready trace state

Examples:

- [src/features/globalReachPopup/globalReachPopupData.js](../../src/features/globalReachPopup/globalReachPopupData.js)
- [src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupData.js](../../src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupData.js)

## 5. Hook the layer click into popup state

In the layer module:

- implement `handleClick`
- find the clicked feature
- build a `selectedStation` object from feature properties

Examples:

- [src/layers/gradesHydroDlLayer.jsx](../../src/layers/gradesHydroDlLayer.jsx)
- [src/layers/cnrfcStreamflowLayer.jsx](../../src/layers/cnrfcStreamflowLayer.jsx)
- [src/layers/cnrfcPointsLayer.jsx](../../src/layers/cnrfcPointsLayer.jsx)

Typical shape:

```js
handleClick({ event, setSelectedStation }) {
  const clickedFeature = ...
  if (!clickedFeature) {
    return false
  }

  setSelectedStation(createSelectedMyPopupState(clickedFeature, {
    layerId: 'myLayer',
    popupOwnerId: 'myLayer',
    longitude: event.lngLat.lng,
    latitude: event.lngLat.lat,
  }))

  return true
}
```

## 6. Decide where the popup component renders

Two options:

### Render from the layer module

Use this when the popup is tightly tied to the layer and does not need a shared mount point.

### Render once from `MapCanvas.jsx`

Use this when:

- the popup is complex
- the layer already has a separate hover popup
- multiple layers may share one popup shell
- you want all feature popups to be mounted in one place

Current examples:

- `GlobalReachPopup`
- `CnrfcStreamflowPopup`

## 7. Add tabs

Tabs are defined in the popup config and rendered in the popup component.

Current tab patterns include:

- simple multi-tab time series
- mixed time series + table
- time series + choropleth map

Examples:

- [src/features/b120PointPopup/b120PointPopupConfig.js](../../src/features/b120PointPopup/b120PointPopupConfig.js)
- [src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupConfig.js](../../src/features/cnrfcStreamflowPopup/cnrfcStreamflowPopupConfig.js)

Recommended:

- load tab data lazily when the tab is first opened
- keep tab ids stable
- keep each tab’s plots independent

## 8. Build Plotly time-series plots

Time-series rendering is usually done through:

- [src/features/cnrfcPointPopup/TimeSeriesPlot.jsx](../../src/features/cnrfcPointPopup/TimeSeriesPlot.jsx)

Plot definitions typically include:

- `sources`
- `series`
- `axes`
- `layout`
- `plotlyConfig`

### Sources

The app already supports multiple source-loader types through:

- [src/lib/plotDataSources.js](../../src/lib/plotDataSources.js)

Current loaders include:

- `csv`
- `gradesSeries`
- `gradesPercentiles`
- `cnrfcSeries`
- `cnrfcPercentiles`

If your popup needs a new backend format, add a new loader there.

### Series

Each plotted line or bar is a series definition.

Typical fields:

- `sourceId`
- `column`
- `label`
- `line`
- `marker`
- `type`
- `yAxis`
- `fill`
- `fillcolor`
- `scaleFactor`

### Axes

Define `axes` in the plot config and keep the y-axis ids aligned with the series.

Examples:

- multi-axis station plots:
  - `cnrfcPointPopup`
- single-axis climatology/flow plots:
  - `globalReachPopup`
  - `cnrfcStreamflowPopup`

## 9. Add CSV download if desired

CSV export is configured per plot through:

```js
csvDownload: {
  enabled: true,
  fileName: ({ station, sourceId, defaultFileName }) => ...
}
```

Shared helpers:

- [src/lib/csvExport.js](../../src/lib/csvExport.js)
- [src/components/PopupCsvDownloadButton.jsx](../../src/components/PopupCsvDownloadButton.jsx)

Supported patterns:

- raw-source export
- generated CSV from normalized in-memory rows
- table export

## 10. Test checklist

After adding a popup, test:

- clicking the layer opens the popup
- the popup does not open for wrong layers
- all tabs switch correctly
- loading, ready, and error states render correctly
- titles look right
- Plotly resize works after tab switching
- CSV export works if enabled
- closing the popup clears state cleanly

## Recommended examples to copy

- CSV-backed station popup:
  - `cnrfcPointPopup`
- mixed time series + table + map popup:
  - `b120PointPopup`
- binary loader popup with climatology:
  - `cnrfcStreamflowPopup`
- shared hydrography popup across two layers:
  - `globalReachPopup`
