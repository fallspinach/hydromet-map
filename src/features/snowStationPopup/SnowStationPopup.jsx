import { useState } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import PopupCsvDownloadButton from '../../components/PopupCsvDownloadButton'
import { downloadCsvFiles } from '../../lib/csvExport'
import TimeSeriesPlot from '../cnrfcPointPopup/TimeSeriesPlot'
import { getDefaultSnowPopupTabId, getSnowPopupTabDefinition, getSnowPopupTabs } from './snowStationPopupConfig'
import { loadSnowStationPopupTabData, setActiveSnowStationPopupTab } from './snowStationPopupData'

function renderPlotPanel(plotState, station) {
  if (plotState.status === 'loading') {
    return <p className="station-popup__status">Loading plot data...</p>
  }

  if (plotState.status === 'error') {
    return <p className="station-popup__status station-popup__status--error">{plotState.error}</p>
  }

  if (plotState.status === 'ready') {
    return (
      <div className="station-popup__plot">
        <TimeSeriesPlot
          stationName={station.name}
          stationId={station.id}
          plotState={plotState}
        />
      </div>
    )
  }

  return <p className="station-popup__status">Select a tab to load its plot data.</p>
}

export default function SnowStationPopup({
  popupDefinition,
  selectedStation,
  setSelectedStation,
}) {
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false)

  if (!selectedStation || selectedStation.popupType !== popupDefinition.popupType) {
    return null
  }

  const tabs = getSnowPopupTabs(popupDefinition)
  const activeTabId = selectedStation.popup?.activeTabId ?? getDefaultSnowPopupTabId(popupDefinition)
  const activeTabDefinition = getSnowPopupTabDefinition(popupDefinition, activeTabId)
  const activeTabState = selectedStation.popup?.tabDataById?.[activeTabId]
  const exportablePlots = (activeTabDefinition?.plots ?? []).filter(
    (plotDefinition) => plotDefinition.csvDownload?.enabled,
  )
  const activeTabDownloadFiles = exportablePlots.flatMap(
    (plotDefinition) => activeTabState?.plotsById?.[plotDefinition.id]?.downloadFiles ?? [],
  )
  const isCsvDownloadReady =
    exportablePlots.length > 0
    && exportablePlots.every(
      (plotDefinition) => activeTabState?.plotsById?.[plotDefinition.id]?.status === 'ready',
    )
    && activeTabDownloadFiles.length > 0

  async function handleDownloadCsv() {
    if (!isCsvDownloadReady || isDownloadingCsv) {
      return
    }

    setIsDownloadingCsv(true)

    try {
      await downloadCsvFiles(activeTabDownloadFiles)
    } catch (error) {
      console.error('Failed to download CSV files for snow popup.', error)
    } finally {
      setIsDownloadingCsv(false)
    }
  }

  return (
    <Popup
      anchor="top"
      closeButton
      closeOnClick={false}
      latitude={selectedStation.latitude}
      longitude={selectedStation.longitude}
      maxWidth={popupDefinition.popupWidth}
      onClose={() => setSelectedStation(null)}
    >
      <div className="station-popup station-popup--timeseries">
        <div className="station-popup__header-row">
          <div className="station-popup__tabs" role="tablist" aria-label="Snow station tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTabId === tab.id}
                className={activeTabId === tab.id ? 'station-popup__tab is-active' : 'station-popup__tab'}
                onClick={() => {
                  setActiveSnowStationPopupTab(setSelectedStation, tab.id)
                  loadSnowStationPopupTabData(setSelectedStation, selectedStation, popupDefinition, tab.id)
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <PopupCsvDownloadButton
            disabled={!isCsvDownloadReady || isDownloadingCsv}
            onClick={handleDownloadCsv}
            title={isDownloadingCsv ? 'Downloading CSV files...' : 'Download CSV files'}
          />
        </div>

        {tabs.map((tab) => {
          const tabDefinition = getSnowPopupTabDefinition(popupDefinition, tab.id)
          const tabState = selectedStation.popup?.tabDataById?.[tab.id]

          return (
            <div
              key={tab.id}
              className="station-popup__tab-panel"
              role="tabpanel"
              hidden={activeTabId !== tab.id}
            >
              {tabDefinition?.plots.map((plotDefinition) => {
                const plotState = tabState?.plotsById?.[plotDefinition.id]

                return (
                  <div key={plotDefinition.id} className="station-popup__plot-panel">
                    {renderPlotPanel(
                      plotState ?? {
                        status: 'idle',
                        error: null,
                      },
                      selectedStation,
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </Popup>
  )
}
