import DatePicker from 'react-datepicker'

function pickerDate(iso) {
  return iso ? new Date(`${iso}T12:00:00`) : null
}

export default function ManifestRasterControls({ family, state, updateFamily, status, retry }) {
  const variables = family.raster.variables
  const dates = variables[state.variable]?.availableDates ?? []
  const index = dates.indexOf(state.date)
  return (
    <div className="manifest-raster-controls" role="group" aria-label={family.label}>
      <div className="manifest-raster-controls__inputs">
        <select aria-label={`${family.label} variable`} value={state.variable}
          disabled={status !== 'ready'} onChange={(event) => updateFamily('variable', event.target.value)}>
          {Object.entries(variables).map(([id, variable]) => (
            <option key={id} value={id} disabled={!variable.availableDates?.length}>{variable.label}</option>
          ))}
        </select>
        <button className="date-icon-button" type="button" aria-label="Previous observation"
          disabled={status !== 'ready' || index <= 0} onClick={() => updateFamily('date', dates[index - 1])}>‹</button>
        <DatePicker
          ariaLabel={`${family.label} date`}
          className="hydromet-datepicker__input"
          calendarClassName="hydromet-datepicker__calendar hydromet-datepicker__calendar--manifest"
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
          selected={pickerDate(state.date)}
          includeDates={dates.map(pickerDate)}
          minDate={pickerDate(dates[0])}
          maxDate={pickerDate(dates.at(-1))}
          disabled={status !== 'ready' || !dates.length}
          showMonthDropdown showYearDropdown dropdownMode="select"
          popperPlacement="bottom-start"
          onChange={(date) => {
            if (date) updateFamily('date', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
          }}
        />
        <button className="date-icon-button" type="button" aria-label="Next observation"
          disabled={status !== 'ready' || index < 0 || index >= dates.length - 1}
          onClick={() => updateFamily('date', dates[index + 1])}>›</button>
      </div>
      {status === 'loading' ? <span role="status">Loading observations…</span> : null}
      {status === 'error' ? <span role="alert">Could not load observations. <button type="button" onClick={retry}>Retry</button></span> : null}
    </div>
  )
}
