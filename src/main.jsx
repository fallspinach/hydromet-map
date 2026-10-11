import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { addProtocol, setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { Protocol } from 'pmtiles'
import './index.css'
import App from './App.jsx'

setWorkerUrl(maplibreWorkerUrl)

if (!window.__hydrometPmtilesProtocolInstalled) {
  const protocol = new Protocol()
  addProtocol('pmtiles', protocol.tile)
  window.__hydrometPmtilesProtocolInstalled = true
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
