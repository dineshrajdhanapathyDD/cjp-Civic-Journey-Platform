import { useState, useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { STATE_NAMES, getCitiesForState, formatLocation } from '../data/indiaLocations'

interface Props {
  state?: string
  city?: string
  onStateChange: (state: string) => void
  onCityChange: (city: string) => void
  compact?: boolean
  showLabel?: boolean
}

export default function IndiaLocationSelector({
  state = '',
  city = '',
  onStateChange,
  onCityChange,
  compact = false,
  showLabel = true,
}: Props) {
  const [citySearch, setCitySearch] = useState('')

  const cities = useMemo(() => getCitiesForState(state), [state])
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities
    return cities.filter(c =>
      c.toLowerCase().includes(citySearch.toLowerCase())
    )
  }, [cities, citySearch])

  const handleStateChange = (newState: string) => {
    onStateChange(newState)
    onCityChange('')
    setCitySearch('')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <MapPin size={14} className="text-civic-500 flex-shrink-0" />
        <select
          value={state}
          onChange={e => handleStateChange(e.target.value)}
          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
        >
          <option value="">All India</option>
          {STATE_NAMES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {state && (
          <select
            value={city}
            onChange={e => onCityChange(e.target.value)}
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin size={16} className="text-civic-500" />
          Location
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Country */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Country</label>
          <input
            type="text"
            value="India"
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">State / UT</label>
          <select
            value={state}
            onChange={e => handleStateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent"
          >
            <option value="">Select State</option>
            {STATE_NAMES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* City */}
        {state && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <div className="relative">
              <input
                type="text"
                value={city || citySearch}
                onChange={e => {
                  setCitySearch(e.target.value)
                  if (!e.target.value) onCityChange('')
                }}
                onFocus={() => setCitySearch(city)}
                placeholder="Search or select city..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-civic-500 focus:border-transparent"
              />
              {citySearch && !city && filteredCities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                  {filteredCities.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        onCityChange(c)
                        setCitySearch('')
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-civic-50 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {!citySearch && !city && (
                <select
                  value={city}
                  onChange={e => onCityChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Display formatted location */}
      {(state || city) && (
        <div className="flex items-center gap-1.5 text-sm text-civic-700 bg-civic-50 px-3 py-1.5 rounded-lg">
          <MapPin size={14} />
          <span>{formatLocation(city, state)}</span>
        </div>
      )}
    </div>
  )
}
