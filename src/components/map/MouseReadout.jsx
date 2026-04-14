import { formatCoordinateLabel } from '../../lib/appState'

export default function MouseReadout({ mouseCoordinates }) {
  return (
    <div className="mouse-readout">
      {mouseCoordinates ? (
        <span>
          {formatCoordinateLabel(mouseCoordinates.latitude, 'N', 'S')},{' '}
          {formatCoordinateLabel(mouseCoordinates.longitude, 'E', 'W')}
        </span>
      ) : (
        <span>Move cursor</span>
      )}
    </div>
  )
}
