function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 4a11 11 0 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 4a11 11 0 0 1 0 16" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.6 8.5c1.4.8 3.4 1.3 5.4 1.3s4-.5 5.4-1.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.6 15.5c1.4-.8 3.4-1.3 5.4-1.3s4 .5 5.4 1.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export default function GlobeProjectionControl({ projection, onProjectionChange }) {
  const nextProjection = projection === 'globe' ? 'mercator' : 'globe'

  return (
    <div className="projection-widget">
      <button
        className="projection-trigger"
        type="button"
        title={projection === 'globe' ? 'Switch to mercator projection' : 'Switch to globe projection'}
        aria-label={projection === 'globe' ? 'Switch to mercator projection' : 'Switch to globe projection'}
        onClick={() => onProjectionChange(nextProjection)}
      >
        <GlobeIcon />
      </button>
    </div>
  )
}
