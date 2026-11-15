import { useEffect, useMemo, useState } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import PopupCsvDownloadButton from '../../components/PopupCsvDownloadButton'
import { buildRawSourceDownloadFiles, downloadCsvFiles } from '../../lib/csvExport'
import TimeSeriesPlot from '../cnrfcPointPopup/TimeSeriesPlot'
import { DEFAULT_TIMESERIES_LAYOUT, DEFAULT_TIMESERIES_PLOTLY_CONFIG, TIMESERIES_POPUP_WIDTH } from '../cnrfcPointPopup/cnrfcPointPopupConfig'
import { loadPublishedSeries, publishedSwePlot } from '../../lib/publicationTimeSeries'

export default function PublicationTimeSeriesPopup({ publication, station, setSelectedStation, choices = [] }) {
  const seriesList = publication.collection.series.filter(series => series.featureId === station.id)
  const series = seriesList.find(item => item.id === station.popup?.activeTabId) ?? seriesList[0]
  const unitSystem = station.popup?.unitSystem === 'customary' ? 'customary' : 'metric'
  const unit = unitSystem === 'customary' ? 'in' : 'mm'
  const [result, setResult] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)
  useEffect(() => {
    let active = true
    if (series) loadPublishedSeries(publication, series).then(
      rows => { if (active) setResult({ seriesId: series.id, rows }) },
      error => { if (active) setResult({ seriesId: series.id, error: error.message }) },
    )
    return () => { active = false }
  }, [publication, series])
  const current = result?.seriesId === series?.id ? result : null
  const plot = useMemo(() => current?.rows ? publishedSwePlot(current.rows, series, unit) : null, [current, series, unit])
  async function handleDownloadCsv() {
    if (!current?.rows || !series || isDownloading) return
    const files = buildRawSourceDownloadFiles({
      plotDefinition: {
        id: series.id,
        csvDownload: { enabled: true, fileName: ({ sourceId }) => sourceId },
      },
      station,
      sourceRecords: Object.fromEntries(publication.collection.assets
        .filter(asset => asset.seriesId === series.id)
        .map(asset => [asset.id, { url: new URL(asset.href, publication.url).href }])),
    })
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await downloadCsvFiles(files)
    } catch (error) {
      setDownloadError({ seriesId: series.id, message: error.message })
    } finally {
      setIsDownloading(false)
    }
  }
  function update(changes) {
    setSelectedStation(previous => previous?.id === station.id && previous.popupOwnerId === station.popupOwnerId
      ? { ...previous, popup: { ...previous.popup, ...changes } } : previous)
  }
  return <Popup longitude={station.longitude} latitude={station.latitude} className="publication-series-map-popup"
    maxWidth={TIMESERIES_POPUP_WIDTH} closeButton closeOnClick={false} closeOnMove={false} onClose={() => setSelectedStation(null)}>
    <div className="station-popup station-popup--timeseries publication-series-popup">
      <div className="station-popup__header-row">
        {choices.length > 1 && <label className="station-popup__control"><span>Observation</span>
          <select aria-label="Observation" value={`${station.popupOwnerId}|${station.id}`} onChange={event => {
            const choice = choices.find(item => `${item.popupOwnerId}|${item.id}` === event.target.value)
            if (choice) setSelectedStation({ ...choice, choices, popup: { activeTabId: '', unitSystem } })
          }}>
            {choices.map(choice => <option key={`${choice.popupOwnerId}|${choice.id}`} value={`${choice.popupOwnerId}|${choice.id}`}>
              {choice.measurementLabel} — {choice.id}
            </option>)}
          </select>
        </label>}

        {seriesList.length > 1 && <label className="station-popup__control station-popup__control--compact"><span>Sensor</span> <select aria-label="Sensor" value={series?.id ?? ''} onChange={event => update({ activeTabId: event.target.value })}>
          {seriesList.map(item => <option key={item.id} value={item.id}>{item.sensor}</option>)}
        </select></label>}
        <label className="station-popup__control station-popup__control--compact"><span>Units</span> <select aria-label="Units" value={unitSystem} onChange={event => update({ unitSystem: event.target.value })}>
          <option value="metric">Metric</option><option value="customary">US customary</option>
        </select></label>
        <PopupCsvDownloadButton
          disabled={!current?.rows || isDownloading}
          onClick={handleDownloadCsv}
          title={isDownloading ? 'Downloading CSV files...' : 'Download CSV files'}
        />
      </div>
      {downloadError?.seriesId === series?.id && <p role="alert" className="station-popup__status station-popup__status--error">{downloadError.message}</p>}
      {!series ? <p className="station-popup__status">No published series for this station.</p>
        : current?.error ? <p className="station-popup__status station-popup__status--error">{current.error}</p>
          : plot ? <div className="station-popup__plot"><TimeSeriesPlot stationName={station.name} stationId={station.id} plotState={{ ...plot, layout: { ...DEFAULT_TIMESERIES_LAYOUT, showlegend: false }, plotlyConfig: DEFAULT_TIMESERIES_PLOTLY_CONFIG, titleText: `${station.name} (${station.id}) — ${station.measurementLabel} SWE` }} /></div>
            : <p className="station-popup__status">Loading SWE data…</p>}
    </div>
  </Popup>
}
