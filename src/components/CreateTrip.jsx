import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { createTrip, updateTrip } from '../lib/tripStorage'
import { luggagePieceLabels, getLuggagePieces, emptyPieces } from '../lib/luggage'
import 'react-day-picker/dist/style.css'

export default function CreateTrip({ trip, onTripSaved, onCancel }) {
  const { user } = useAuth()
  const isEditing = !!trip
  const [formData, setFormData] = useState({
    destination: trip?.destination || '',
    startDate: trip?.start_date || '',
    endDate: trip?.end_date || '',
    weather: trip?.weather || 'mild',
    luggageSize: trip?.luggage_size || 'medium',
    luggagePieces: trip ? getLuggagePieces(trip) : { ...emptyPieces, medium: 1 }
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Días entre las fechas, ambos incluidos. Negativo si el fin es anterior.
  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0
    return differenceInCalendarDays(
      parseISO(formData.endDate),
      parseISO(formData.startDate)
    ) + 1
  }

  const durationDays = calculateDuration()
  const hasInvalidRange = durationDays < 1
  const isCustomLuggage = formData.luggageSize === 'custom'
  const totalPieces = Object.values(formData.luggagePieces).reduce((a, b) => a + b, 0)
  const hasNoPieces = isCustomLuggage && totalPieces === 0

  const changePieceCount = (type, delta) => {
    setFormData({
      ...formData,
      luggagePieces: {
        ...formData.luggagePieces,
        [type]: Math.max(0, Math.min(4, formData.luggagePieces[type] + delta))
      }
    })
  }

  const handleStartSelect = (date) => {
    if (!date) return
    const startDate = format(date, 'yyyy-MM-dd')
    setFormData({
      ...formData,
      startDate,
      // Si el fin quedaba antes del nuevo inicio, se descarta
      endDate: formData.endDate && formData.endDate < startDate ? '' : formData.endDate
    })
    setShowStartPicker(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.startDate || !formData.endDate) {
      setError('Elige la fecha de inicio y la de fin')
      return
    }
    if (hasInvalidRange) {
      setError('La fecha de fin no puede ser anterior a la de inicio')
      return
    }
    if (hasNoPieces) {
      setError('Agrega al menos una pieza de equipaje')
      return
    }
    if (!user) {
      setError('No hay usuario autenticado')
      return
    }

    setLoading(true)
    try {
      const tripData = {
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        weather: formData.weather,
        luggage_size: formData.luggageSize,
        luggage_pieces: isCustomLuggage
          ? formData.luggagePieces
          : { ...emptyPieces, [formData.luggageSize]: 1 },
        duration_days: durationDays
      }

      const savedTrip = isEditing
        ? await updateTrip(trip.id, tripData)
        : await createTrip(user.id, tripData)

      onTripSaved(savedTrip)
    } catch (err) {
      setError(err.message || 'Error al guardar el viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Editar viaje' : 'Crear Nuevo Viaje'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destino
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="destination"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Ej: París, Francia"
                  value={formData.destination}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <button
                  type="button"
                  onClick={() => setShowStartPicker(!showStartPicker)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-gray-900 text-left flex items-center justify-between"
                >
                  {formData.startDate ? format(parseISO(formData.startDate), 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4 V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {showStartPicker && (
                  <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg border p-4">
                    <DayPicker
                      mode="single"
                      selected={formData.startDate ? parseISO(formData.startDate) : undefined}
                      onSelect={handleStartSelect}
                      locale={es}
                      className="rdp"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de fin
                </label>
                <button
                  type="button"
                  onClick={() => setShowEndPicker(!showEndPicker)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-gray-900 text-left flex items-center justify-between"
                >
                  {formData.endDate ? format(parseISO(formData.endDate), 'PPP', { locale: es }) : 'Seleccionar fecha'}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4 V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {showEndPicker && (
                  <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg border p-4">
                    <DayPicker
                      mode="single"
                      selected={formData.endDate ? parseISO(formData.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, endDate: format(date, 'yyyy-MM-dd') })
                          setShowEndPicker(false)
                        }
                      }}
                      disabled={formData.startDate ? { before: parseISO(formData.startDate) } : undefined}
                      locale={es}
                      className="rdp"
                    />
                  </div>
                )}
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              hasInvalidRange ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    La fecha de fin no puede ser anterior a la de inicio.
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-sky-50 to-slate-50 p-4 rounded-lg border border-sky-100">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-sky-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-sky-700">
                      Duración del viaje: <strong>{durationDays} {durationDays === 1 ? 'día' : 'días'}</strong>
                    </p>
                  </div>
                </div>
              )
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clima esperado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <select
                  name="weather"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all appearance-none bg-white text-gray-900"
                  value={formData.weather}
                  onChange={handleChange}
                >
                  <option value="hot">🌞 Calor</option>
                  <option value="cold">❄️ Frío</option>
                  <option value="rainy">🌧️ Lluvioso</option>
                  <option value="mild">🌤️ Templado</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño del equipaje
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <select
                  name="luggageSize"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all appearance-none bg-white text-gray-900"
                  value={formData.luggageSize}
                  onChange={handleChange}
                >
                  <option value="small">🎒 Pequeño (mochila)</option>
                  <option value="medium">🧳 Mediano (maleta cabina)</option>
                  <option value="large">🧳 Grande (maleta documentada)</option>
                  <option value="custom">🎯 Personalizado (varias piezas)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isCustomLuggage && (
                <div className="mt-4 space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Indica cuántas piezas de cada tipo llevas en este viaje.
                  </p>
                  {Object.entries(luggagePieceLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{label}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => changePieceCount(type, -1)}
                          disabled={formData.luggagePieces[type] === 0}
                          aria-label={`Quitar ${label}`}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900">
                          {formData.luggagePieces[type]}
                        </span>
                        <button
                          type="button"
                          onClick={() => changePieceCount(type, 1)}
                          disabled={formData.luggagePieces[type] >= 4}
                          aria-label={`Agregar ${label}`}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  {hasNoPieces && (
                    <p className="text-sm text-red-700">Agrega al menos una pieza de equipaje.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || hasInvalidRange || hasNoPieces}
                className="px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-lg hover:from-sky-700 hover:to-sky-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  isEditing ? 'Guardar cambios' : 'Crear Viaje'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
