import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import './index.css'
import App from './App.jsx'

if (!window.__hydrometPmtilesProtocolInstalled) {
  const protocol = new Protocol()
  maplibregl.addProtocol('pmtiles', protocol.tile)
  window.__hydrometPmtilesProtocolInstalled = true
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
