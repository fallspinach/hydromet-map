import DatePicker from 'react-datepicker'
import {
  BASEMAPS,
  getProjectMapLayers,
} from '../../config/mapConfig'
import {
  formatIsoDateTimeLocal,
  getTemporalModeForTimestep,
  parseIsoDate,
  parseIsoDateTime,
  parseTimestep,
  shiftIsoDate,
  shiftIsoDateTime,
  shiftIsoMonth,
} from '../../lib/appState'

export default function MapHud({
  activeProject,
  appState,
  basemapMenuRef,
  basemapMenuOpen,
  layerMenuOpen,
  layerMenuRef,
  rasterFamily,
  selectedBasemap,
  setBasemapMenuOpen,
  setLayerMenuOpen,
  statusBoundary,
  updateRaster,
  updateTopLevel,
  toggleLayer,
}) {
  const projectLayers = getProjectMapLayers(activeProject?.id)
  const rasterVariables = rasterFamily?.variables ?? {}
  const rasterVariableIds = Object.keys(rasterVariables)
  const selectedRasterVariable =
    rasterVariables[appState.raster?.variable] ?? rasterVariables[rasterVariableIds[0]] ?? null
  const rasterProducts = rasterFamily?.products ?? []
  const ensembleTraces = rasterFamily?.ensembleTraces ?? []
  const isDateTimeMode =
    selectedRasterVariable
      ? getTemporalModeForTimestep(selectedRasterVariable.timestep) === 'datetime'
      : false
  const shortStep = parseTimestep(selectedRasterVariable?.timestep ?? '1day')
  const shortStepLabel = `${shortStep.amount} ${shortStep.unit}${shortStep.amount === 1 ? '' : 's'}`
  const forecastProducts = rasterProducts.filter((product) => product !== 'NRT')
  const allowsForecastProducts = selectedRasterVariable
    ? (
        isDateTimeMode
          ? appState.raster.datetime > statusBoundary.boundaryDateTime
          : appState.raster.date > statusBoundary.boundaryDate
      )
    : false
  const allowedProducts = rasterFamily ? (allowsForecastProducts ? forecastProducts : ['NRT']) : []
  const allowedProductSet = new Set(allowedProducts)
  const isForecastProduct = appState.raster?.product !== 'NRT'
  const maxPickerDate = parseIsoDate(statusBoundary.maxDate)
  const maxPickerDateTime = parseIsoDateTime(statusBoundary.maxDateTime)
  const selectedDateTime = parseIsoDateTime(appState.raster?.datetime ?? '')
  const isSelectedOnMaxDate =
    selectedDateTime &&
    maxPickerDateTime &&
    selectedDateTime.toDateString() === maxPickerDateTime.toDateString()
  const maxTime = isSelectedOnMaxDate ? maxPickerDateTime : undefined

  return (
    <div className="map-canvas__overlay">
      <div className="scene-tools">
        <div
          ref={basemapMenuRef}
          className={basemapMenuOpen ? 'basemap-switcher is-open' : 'basemap-switcher'}
          title={selectedBasemap.description}
        >
          <button
            className="choice-card choice-card--current is-active"
            type="button"
            aria-label={`Current basemap: ${selectedBasemap.label}`}
            onClick={() => setBasemapMenuOpen((current) => !current)}
          >
            <strong>{selectedBasemap.label}</strong>
          </button>

          <div className="basemap-switcher__menu">
            {BASEMAPS.map((basemap) => (
              <button
                key={basemap.id}
                className={basemap.id === appState.basemapId ? 'choice-card is-active' : 'choice-card'}
                onClick={() => {
                  updateTopLevel('basemapId', basemap.id)
                  if (!basemap.terrainAvailable && appState.terrainEnabled) {
                    updateTopLevel('terrainEnabled', false)
                  }
                  setBasemapMenuOpen(false)
                }}
                type="button"
                title={basemap.description}
              >
                <strong>{basemap.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div ref={layerMenuRef} className={layerMenuOpen ? 'layer-toggle is-open' : 'layer-toggle'}>
          <button
            className="scene-icon-button"
            type="button"
            aria-label="Layer toggles"
            title="Layer toggles"
            onClick={() => setLayerMenuOpen((current) => !current)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4 4.5 8 12 12 19.5 8 12 4Z" />
              <path d="M4.5 11.5 12 15.5l7.5-4" />
              <path d="M4.5 15 12 19l7.5-4" />
            </svg>
          </button>

          <div className="layer-toggle__menu">
            {projectLayers.map((layer) => {
              const symbolColor =
                layer.id === 'cnrfcRaster' && selectedRasterVariable
                  ? selectedRasterVariable.palette.colors.at(-1) ?? '#1d6996'
                  : layer.symbolColor ?? '#4a7189'

              return (
                <label
                  key={layer.id}
                  className={appState.layers[layer.id] ? 'layer-row is-on' : 'layer-row is-off'}
                  title={layer.description}
                >
                  <strong className="layer-row__label">
                    <span className="layer-row__symbol" style={{ color: symbolColor }}>
                      {layer.symbol ?? '\u25A1'}
                    </span>
                    <span>{layer.label}</span>
                  </strong>
                  <input
                    type="checkbox"
                    checked={appState.layers[layer.id]}
                    onChange={() => toggleLayer(layer.id)}
                  />
                </label>
              )
            })}
          </div>
        </div>

        {rasterFamily && appState.raster && selectedRasterVariable ? (
          <div className="date-row date-row--map">
            {isDateTimeMode ? (
              <>
                <button
                  className="date-icon-button date-icon-button--day"
                  type="button"
                  aria-label="Previous day"
                  title="-1 day"
                  onClick={() => {
                    updateRaster('datetime', shiftIsoDateTime(appState.raster.datetime, -1, 0))
                  }}
                >
                  <span aria-hidden="true">{'<<'}</span>
                </button>

                <button
                  className="date-icon-button date-icon-button--hour"
                  type="button"
                  aria-label="Previous hour"
                  title={`-${shortStepLabel}`}
                  onClick={() => {
                    updateRaster('datetime', shiftIsoDateTime(appState.raster.datetime, 0, -shortStep.amount))
                  }}
                >
                  <span aria-hidden="true">{'<'}</span>
                </button>

                <label className="date-field date-field--datetime">
                  <DatePicker
                    calendarClassName="hydromet-datepicker__calendar"
                    className="hydromet-datepicker__input"
                    dateFormat="yyyy-MM-dd HH:mm"
                    maxDate={maxPickerDate}
                    maxTime={maxTime}
                    placeholderText="YYYY-MM-DD HH:mm"
                    popperPlacement="bottom-start"
                    selected={parseIsoDateTime(appState.raster.datetime)}
                    showTimeSelect
                    timeCaption="Time"
                    timeFormat="HH:mm"
                    timeIntervals={60}
                    onChange={(date) => {
                      if (date) {
                        updateRaster('datetime', formatIsoDateTimeLocal(date))
                      }
                    }}
                  />
                </label>

                <button
                  className="date-icon-button date-icon-button--hour-next"
                  type="button"
                  aria-label="Next hour"
                  title={`+${shortStepLabel}`}
                  onClick={() => {
                    updateRaster('datetime', shiftIsoDateTime(appState.raster.datetime, 0, shortStep.amount))
                  }}
                >
                  <span aria-hidden="true">{'>'}</span>
                </button>

                <button
                  className="date-icon-button date-icon-button--day-next"
                  type="button"
                  aria-label="Next day"
                  title="+1 day"
                  onClick={() => {
                    updateRaster('datetime', shiftIsoDateTime(appState.raster.datetime, 1, 0))
                  }}
                >
                  <span aria-hidden="true">{'>>'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="date-icon-button"
                  type="button"
                  aria-label="One month before"
                  title="-1 month"
                  onClick={() => {
                    updateRaster('date', shiftIsoMonth(appState.raster.date, -1))
                  }}
                >
                  <span aria-hidden="true">{'<<'}</span>
                </button>

                <button
                  className="date-icon-button"
                  type="button"
                  aria-label="Previous day"
                  title="-1 day"
                  onClick={() => {
                    updateRaster('date', shiftIsoDate(appState.raster.date, -1))
                  }}
                >
                  <span aria-hidden="true">{'<'}</span>
                </button>

                <label className="date-field">
                  <DatePicker
                    calendarClassName="hydromet-datepicker__calendar"
                    className="hydromet-datepicker__input"
                    dateFormat="yyyy-MM-dd"
                    maxDate={maxPickerDate}
                    placeholderText="YYYY-MM-DD"
                    popperPlacement="bottom-start"
                    selected={parseIsoDate(appState.raster.date)}
                    onChange={(date) => {
                      if (date) {
                        updateRaster('date', date.toISOString().slice(0, 10))
                      }
                    }}
                  />
                </label>

                <button
                  className="date-icon-button"
                  type="button"
                  aria-label="Next day"
                  title="+1 day"
                  onClick={() => {
                    updateRaster('date', shiftIsoDate(appState.raster.date, 1))
                  }}
                >
                  <span aria-hidden="true">{'>'}</span>
                </button>

                <button
                  className="date-icon-button"
                  type="button"
                  aria-label="One month after"
                  title="+1 month"
                  onClick={() => {
                    updateRaster('date', shiftIsoMonth(appState.raster.date, 1))
                  }}
                >
                  <span aria-hidden="true">{'>>'}</span>
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="raster-toolbar">
        {rasterFamily && appState.raster ? (
          <>
            <select
              value={appState.raster.variable}
              title="Raster variable"
              onChange={(event) => updateRaster('variable', event.target.value)}
            >
              {Object.entries(rasterVariables).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className={isForecastProduct ? 'raster-toolbar__select raster-toolbar__select--forecast' : 'raster-toolbar__select'}
              value={appState.raster.product}
              title="Raster product"
              onChange={(event) => updateRaster('product', event.target.value)}
            >
              {rasterProducts.map((product) => (
                <option key={product} value={product} disabled={!allowedProductSet.has(product)}>
                  {product}
                </option>
              ))}
            </select>

            <select
              value={appState.raster.ensemble}
              title="Ensemble trace"
              onChange={(event) => updateRaster('ensemble', event.target.value)}
            >
              {ensembleTraces.map((trace) => (
                <option key={trace} value={trace}>
                  {trace}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>
    </div>
  )
}
