export default function MapLegend({ palette, units, variableLabel }) {
  return (
    <div className="map-legend">
      <div className="legend-card legend-card--map">
        <div className="legend-card__header legend-card__header--map">
          <span>{units}</span>
        </div>
        <div className="legend-scale legend-scale--vertical">
          {palette
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={`${variableLabel}-${entry.value}`}
                className="legend-scale__stop legend-scale__stop--vertical"
              >
                <span style={{ backgroundColor: entry.color }} />
                <small>{entry.value}</small>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
