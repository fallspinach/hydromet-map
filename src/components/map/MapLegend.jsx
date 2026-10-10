export default function MapLegend({ compactUnits = false, palette, units, variableLabel }) {
  if (palette.imageUrl) {
    return (
      <div className="map-legend map-legend--image">
        <div className="legend-card legend-card--map">
          <strong>{variableLabel}</strong>
          <img src={palette.imageUrl} alt={`${variableLabel}: ${palette.min} to ${palette.max}, ${palette.name}`} />
        </div>
      </div>
    )
  }
  const colors = palette.colors.slice().reverse()
  const thresholds = palette.thresholds.slice().reverse()
  const bounded = thresholds.length === colors.length + 1

  return (
    <div className={`map-legend${compactUnits ? ' map-legend--compact-units' : ''}`}>
      <div className={compactUnits ? 'legend-card legend-card--map legend-card--compact-units' : 'legend-card legend-card--map'}>
        <div className="legend-card__header legend-card__header--map">
          <span>{units || variableLabel}</span>
        </div>
        <div className="legend-scale legend-scale--threshold">
          <div className="legend-scale__bar">
            {colors.map((color, index) => (
              <span
                key={`${variableLabel}-color-${color}-${index}`}
                className="legend-scale__segment"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div
            className={bounded ? 'legend-scale__labels legend-scale__labels--bounded' : 'legend-scale__labels'}
            style={{ '--legend-segment-count': colors.length }}
          >
            {thresholds.map((threshold, index) => (
              <small
                key={`${variableLabel}-threshold-${threshold}-${index}`}
                style={bounded ? { top: `${100 * index / colors.length}%` } : { gridRowStart: index + 2 }}
              >
                {threshold}
              </small>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
