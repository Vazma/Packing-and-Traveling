import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MapPin,
  Hotel,
  Utensils,
  Camera,
  Bus,
  Link as LinkIcon,
  Plus,
  Trash2,
  Pencil,
  Check,
  ExternalLink,
  ChevronDown,
  ArrowDown,
  X,
  Copy
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loadUserTrips, copyTripForUser } from '../lib/tripStorage'
import {
  loadItinerary,
  addCountry,
  updateCountry,
  deleteCountry,
  addCity,
  updateCity,
  deleteCity,
  addLink,
  updateLink,
  deleteLink,
  copyItineraryToTrip
} from '../lib/itineraryStorage'

const linkTypes = {
  lodging: { label: 'Hospedaje', icon: Hotel },
  restaurant: { label: 'Restaurante', icon: Utensils },
  attraction: { label: 'Atracción', icon: Camera },
  transport: { label: 'Transporte', icon: Bus },
  other: { label: 'Otro', icon: LinkIcon }
}

function formatCityDate(city) {
  if (!city.arrival_date && !city.departure_date) return null
  const start = city.arrival_date ? format(parseISO(city.arrival_date), 'd MMM', { locale: es }) : ''
  const end = city.departure_date ? format(parseISO(city.departure_date), 'd MMM', { locale: es }) : ''
  if (start && end) return `${start} - ${end}`
  return start || end
}

function EditableName({ value, onSave, onCancel }) {
  const [text, setText] = useState(value)
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(text) }}
      onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
      className="flex items-center space-x-2 flex-1"
    >
      <input
        autoFocus
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <button type="submit" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Guardar</button>
    </form>
  )
}

function AddForm({ placeholder, onSubmit }) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(value); setValue('') }}
      className="flex items-center space-x-2"
    >
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <button
        type="submit"
        className="p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        aria-label="Agregar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </form>
  )
}

function CityForm({ trip, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [error, setError] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError('')
        if (!name.trim() || !arrivalDate || arrivalDate < trip.start_date || arrivalDate > trip.end_date) return
        onSubmit({
          name: name.trim(),
          arrival_date: arrivalDate,
          departure_date: (departureDate && departureDate >= arrivalDate && departureDate <= trip.end_date) ? departureDate : null
        }).catch(error => {
          console.error('Error al guardar ciudad:', error)
          setError(error?.message || 'No se pudo guardar la ciudad')
        })
      }}
      className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200"
    >
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded-lg">
          {error}
        </p>
      )}
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre de la ciudad"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="date"
          value={arrivalDate}
          onChange={e => setArrivalDate(e.target.value)}
          min={trip.start_date}
          max={trip.end_date}
          aria-label="Fecha de llegada"
          required
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <input
          type="date"
          value={departureDate}
          onChange={e => setDepartureDate(e.target.value)}
          min={arrivalDate || trip.start_date}
          max={trip.end_date}
          disabled={!arrivalDate}
          aria-label="Fecha de salida (opcional)"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function LinkForm({ initial = {}, onSubmit, onCancel }) {
  const [type, setType] = useState(initial.type || 'attraction')
  const [name, setName] = useState(initial.name || '')
  const [url, setUrl] = useState(initial.url || '')
  const [notes, setNotes] = useState(initial.notes || '')
  const [error, setError] = useState('')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError('')
        if (!name.trim()) {
          setError('El nombre es obligatorio')
          return
        }
        onSubmit({ type, name, url, notes }).catch(error => {
          console.error('Error al guardar link:', error)
          setError(error?.message || 'No se pudo guardar el link')
        })
      }}
      className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200"
    >
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded-lg">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {Object.entries(linkTypes).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://maps.google.com/..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notas (opcional)"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700"
        >
          Guardar
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default function ItineraryView({ trip, onClose }) {
  const { user } = useAuth()
  const [itinerary, setItinerary] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [editing, setEditing] = useState(null)
  const [addingCityCountryId, setAddingCityCountryId] = useState(null)
  const [addingLinkCityId, setAddingLinkCityId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importTrips, setImportTrips] = useState([])
  const [importTarget, setImportTarget] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  const applyData = useCallback(data => {
    setItinerary(data)
    setExpanded(prev => {
      const next = { ...prev }
      for (const country of data) {
        if (next[country.id] === undefined) next[country.id] = true
        for (const city of country.cities) {
          if (next[city.id] === undefined) next[city.id] = true
        }
      }
      return next
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadItinerary(trip.id)
      applyData(data)
    } catch (error) {
      console.error('Error al cargar el itinerario:', error)
    } finally {
      setLoading(false)
    }
  }, [trip.id, applyData])

  useEffect(() => {
    let cancelled = false
    loadItinerary(trip.id)
      .then(data => {
        if (cancelled) return
        applyData(data)
        setIsEditing(data.length === 0)
      })
      .catch(error => console.error('Error al cargar el itinerario:', error))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [trip.id, applyData])

  useEffect(() => {
    if (!showImport || !user) return
    loadUserTrips(user.id)
      .then(trips => setImportTrips(trips.filter(t => t.id !== trip.id)))
      .catch(() => setImportError('No se pudieron cargar tus viajes'))
  }, [showImport, user, trip.id])

  const toggle = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleAddCountry = async name => {
    if (!name.trim()) return
    await addCountry(trip.id, name.trim())
    load()
  }

  const handleUpdateCountry = async (countryId, name) => {
    if (!name.trim()) return
    await updateCountry(countryId, name.trim())
    load()
    setEditing(null)
  }

  const handleAddCity = async (countryId, fields) => {
    if (!fields.name.trim() || !fields.arrival_date) return
    await addCity(countryId, {
      name: fields.name.trim(),
      arrival_date: fields.arrival_date,
      departure_date: fields.departure_date || null
    })
    load()
    setExpanded(prev => ({ ...prev, [countryId]: true }))
    setAddingCityCountryId(null)
  }

  const handleUpdateCity = async (cityId, name) => {
    if (!name.trim()) return
    await updateCity(cityId, name.trim())
    load()
    setEditing(null)
  }

  const handleAddLink = async (cityId, fields) => {
    if (!fields.name.trim()) return
    await addLink(cityId, {
      type: fields.type,
      name: fields.name.trim(),
      url: fields.url.trim() || null,
      notes: fields.notes.trim() || null
    })
    load()
    setExpanded(prev => ({ ...prev, [cityId]: true }))
    setAddingLinkCityId(null)
  }

  const handleUpdateLink = async (linkId, fields) => {
    if (!fields.name.trim()) return
    await updateLink(linkId, {
      type: fields.type,
      name: fields.name.trim(),
      url: fields.url.trim() || null,
      notes: fields.notes.trim() || null
    })
    load()
    setEditing(null)
  }

  const LinkRow = ({ link }) => {
    const { icon: Icon, label } = linkTypes[link.type] || linkTypes.other
    if (isEditing && editing?.id === link.id && editing?.kind === 'link') {
      return (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <LinkForm
            initial={link}
            onSubmit={fields => handleUpdateLink(link.id, fields)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )
    }
    return (
      <div className="flex items-start justify-between px-4 py-3 border-t border-gray-100 hover:bg-gray-50 group">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="p-1.5 bg-sky-100 text-sky-700 rounded-md shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{link.name}</p>
            {link.notes && <p className="text-xs text-gray-500 truncate">{link.notes}</p>}
            <p className="text-xs text-sky-600">{label}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2 shrink-0">
          {link.url && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"
              aria-label="Abrir enlace"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => setEditing({ id: link.id, kind: 'link' })}
                className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteLink(link.id).then(load)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const CityBlock = ({ city }) => {
    const isExpanded = expanded[city.id] !== false
    const cityDate = formatCityDate(city)
    return (
      <div className="border-t border-gray-100">
        <button
          onClick={() => toggle(city.id)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
        >
          {isEditing && editing?.id === city.id && editing?.kind === 'city' ? (
            <div onClick={e => e.stopPropagation()} className="flex-1 mr-2">
              <EditableName
                value={city.name}
                onSave={name => handleUpdateCity(city.id, name)}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <div className="font-medium text-gray-800 flex flex-col items-start">
              <span className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>{city.name}</span>
              </span>
              {cityDate && (
                <span className="text-xs text-gray-500 ml-6">{cityDate}</span>
              )}
            </div>
          )}
          <div className="flex items-center space-x-1">
            {isEditing && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setEditing({ id: city.id, kind: 'city' }) }}
                  className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                  aria-label="Editar ciudad"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCity(city.id).then(load) }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label="Eliminar ciudad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isExpanded && (
          <div className="bg-slate-50/50">
            {city.links.map(link => <LinkRow key={link.id} link={link} />)}
            {isEditing && (
              <div className="px-4 py-3 border-t border-gray-100">
                {addingLinkCityId === city.id ? (
                  <LinkForm
                    onSubmit={fields => handleAddLink(city.id, fields)}
                    onCancel={() => setAddingLinkCityId(null)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingLinkCityId(city.id)}
                    className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar link</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const CountryBlock = ({ country }) => {
    const isExpanded = expanded[country.id] !== false
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => toggle(country.id)}
          className="w-full flex items-center justify-between px-4 py-4 text-left bg-slate-50 hover:bg-slate-100"
        >
          {isEditing && editing?.id === country.id && editing?.kind === 'country' ? (
            <div onClick={e => e.stopPropagation()} className="flex-1 mr-2">
              <EditableName
                value={country.name}
                onSave={name => handleUpdateCountry(country.id, name)}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <span className="font-semibold text-gray-900">{country.name}</span>
          )}
          <div className="flex items-center space-x-1">
            {isEditing && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setEditing({ id: country.id, kind: 'country' }) }}
                  className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                  aria-label="Editar país"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCountry(country.id).then(load) }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label="Eliminar país"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isExpanded && (
          <div>
            {country.cities.map(city => <CityBlock key={city.id} city={city} />)}
            {isEditing && (
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                {addingCityCountryId === country.id ? (
                  <CityForm
                    trip={trip}
                    onSubmit={fields => handleAddCity(country.id, fields)}
                    onCancel={() => setAddingCityCountryId(null)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingCityCountryId(country.id)}
                    className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar ciudad</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const handleImport = async (e) => {
    e.preventDefault()
    setImportError('')
    setImportSuccess('')
    if (!importTarget) {
      setImportError('Selecciona un viaje de destino')
      return
    }
    setImportLoading(true)
    try {
      await copyItineraryToTrip(trip.id, importTarget)
      setImportSuccess('Itinerario copiado correctamente')
      setImportTarget('')
    } catch (err) {
      setImportError(err.message || 'No se pudo copiar el itinerario')
    } finally {
      setImportLoading(false)
    }
  }

  const handleCreateNew = async () => {
    setImportError('')
    setImportSuccess('')
    if (!user) {
      setImportError('No hay sesión activa')
      return
    }
    setImportLoading(true)
    try {
      const newTrip = await copyTripForUser(trip.id, user.id)
      setImportSuccess(`Viaje nuevo creado: ${newTrip.destination}`)
    } catch (err) {
      setImportError(err.message || 'No se pudo crear el viaje')
    } finally {
      setImportLoading(false)
    }
  }

  const closeImport = () => {
    setShowImport(false)
    setImportTarget('')
    setImportError('')
    setImportSuccess('')
  }

  return (
    <>
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Itinerario: {trip.destination}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {format(parseISO(trip.start_date), 'PPP', { locale: es })} - {format(parseISO(trip.end_date), 'PPP', { locale: es })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border border-sky-600 text-sky-700 hover:bg-sky-50 transition-colors"
              >
                {isEditing ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Listo</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span>Editar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowImport(true)}
                title="Copiar itinerario a otro de mis viajes"
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border border-sky-600 text-sky-700 hover:bg-sky-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando itinerario...</p>
            </div>
          ) : (
            <>
              {isEditing && (
                <div className="mb-4">
                  <AddForm
                    placeholder="Agregar país (ej. Austria)..."
                    onSubmit={handleAddCountry}
                  />
                </div>
              )}

              {itinerary.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-gray-600">Todavía no hay países en el itinerario.</p>
                  {isEditing ? (
                    <p className="text-sm text-gray-500">Agrega uno arriba para empezar.</p>
                  ) : (
                    <p className="text-sm text-gray-500">Toca Editar para empezar.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {itinerary.map((country, index) => (
                    <div key={country.id}>
                      <CountryBlock country={country} />
                      {index < itinerary.length - 1 && (
                        <div className="flex justify-center py-2">
                          <ArrowDown className="w-5 h-5 text-sky-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    {showImport && (
      <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Copiar itinerario</h2>
            <button
              onClick={closeImport}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Elige el viaje al que quieres copiar este itinerario.
          </p>

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {importSuccess}
            </div>
          )}

          {importTrips.length === 0 && !importSuccess && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              No tienes otros viajes existentes. Podés crear uno nuevo con este itinerario abajo.
            </p>
          )}

          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viaje de destino
              </label>
              <select
                value={importTarget}
                onChange={e => setImportTarget(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
              >
                <option value="">Seleccionar viaje</option>
                {importTrips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.destination} ({t.start_date} a {t.end_date})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeImport}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={importLoading || !importTarget}
                className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                {importLoading ? 'Copiando...' : 'Copiar'}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={importLoading}
              className="w-full px-4 py-3 border border-sky-600 text-sky-700 rounded-lg hover:bg-sky-50 transition-colors disabled:opacity-50"
            >
              Crear un viaje nuevo con este itinerario
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}
