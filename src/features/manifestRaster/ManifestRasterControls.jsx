import DatePicker from 'react-datepicker'
import { stepPublicationDate } from '../../lib/publicationRaster'

function pickerDate(iso) {
  return iso ? new Date(`${iso}T12:00:00`) : null
}

export default function ManifestRasterControls({ family, state, updateFamily, status, retry, section }) {
  const variables = family.raster.variables
  const dates = variables[state.variable]?.availableDates ?? []
  const index = dates.indexOf(state.date)
  const selected = variables[state.variable]
  if (section === 'variable') {
    return (
      <select aria-label={`${family.label} variable`} value={state.variable} title={selected?.label}
        disabled={status !== 'ready'} onChange={event => updateFamily('variable', event.target.value)}>
        {Object.entries(variables).map(([id, variable]) => (
          <option key={id} value={id} disabled={!variable.availableDates?.length} title={variable.label}>
            {variable.shortLabel || variable.label}
          </option>
        ))}
      </select>
    )
  }
  if (section === 'date') {
    const monthly = selected?.resolution === 'monthly'
    const button = (amount, unit, label, symbol) => {
      const target = stepPublicationDate(state.date, dates, amount, unit)
      return (
        <button className="date-icon-button" type="button" aria-label={label}
          title={`${amount > 0 ? '+' : '-'}1 ${unit}`}
          disabled={status !== 'ready' || !dates.length || target === state.date || (monthly && unit === 'day')}
          onClick={() => updateFamily('date', target)}>
          <span aria-hidden="true">{symbol}</span>
        </button>
      )
    }
    return (
      <div className="publication-date-controls" role="group" aria-label={`${family.label} dates`}>
        <div className="date-row date-row--map date-row--publication">
          {button(-1, 'month', 'One month before', '<<')}
          {button(-1, 'day', 'Previous day', '<')}
          <label className="date-field">
            <DatePicker ariaLabel={`${family.label} date`}
              className="hydromet-datepicker__input"
              calendarClassName="hydromet-datepicker__calendar hydromet-datepicker__calendar--manifest"
              dateFormat={monthly ? 'yyyy-MM' : 'yyyy-MM-dd'}
              selected={pickerDate(state.date)} includeDates={dates.map(pickerDate)}
              minDate={pickerDate(dates[0])} maxDate={pickerDate(dates.at(-1))}
              disabled={status !== 'ready' || !dates.length}
              showMonthDropdown showYearDropdown dropdownMode="select" popperPlacement="bottom-start"
              onChange={date => {
                if (date) updateFamily('date', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
              }} />
          </label>
          {button(1, 'day', 'Next day', '>')}
          {button(1, 'month', 'One month after', '>>')}
        </div>
        {status === 'loading' ? <span role="status">Loading observations…</span> : null}
        {status === 'error' ? <span role="alert">Could not load observations. <button type="button" onClick={retry}>Retry</button></span> : null}
      </div>
    )
  }
  return (
    <div className="manifest-raster-controls" role="group" aria-label={family.label}>
      <div className="manifest-raster-controls__inputs">
        <select aria-label={`${family.label} variable`} value={state.variable} title={selected?.label}
          disabled={status !== 'ready'} onChange={(event) => updateFamily('variable', event.target.value)}>
          {Object.entries(variables).map(([id, variable]) => (
            <option key={id} value={id} disabled={!variable.availableDates?.length} title={variable.label}>{variable.shortLabel || variable.label}</option>
          ))}
        </select>
        <div className="manifest-raster-dates">
        <button className="date-icon-button" type="button" aria-label="Previous observation"
          disabled={status !== 'ready' || index <= 0} onClick={() => updateFamily('date', dates[index - 1])}>‹</button>
        <DatePicker
          ariaLabel={`${family.label} date`}
          className="hydromet-datepicker__input"
          calendarClassName="hydromet-datepicker__calendar hydromet-datepicker__calendar--manifest"
          dateFormat={selected?.resolution === 'monthly' ? 'yyyy-MM' : 'yyyy-MM-dd'}
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
      </div>
      {status === 'loading'  ? <span role="status">Loading observations…</span> : null}
      {status === 'error' ? <span role="alert">Could not load observations. <button type="button" onClick={retry}>Retry</button></span> : null}
    </div>
  )
}
