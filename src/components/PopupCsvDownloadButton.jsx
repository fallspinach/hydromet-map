export default function PopupCsvDownloadButton({
  disabled = false,
  onClick,
  title = 'Download CSV',
}) {
  return (
    <button
      type="button"
      className="station-popup__download-button"
      disabled={disabled}
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v10" />
        <path d="M8 9l4 4 4-4" />
        <path d="M5 15v4h14v-4" />
      </svg>
    </button>
  )
}
