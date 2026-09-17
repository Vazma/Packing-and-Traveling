import { useState } from 'react'
import { Copy, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { findUserByUsername, copyTripForUser } from '../lib/tripStorage'

export default function ShareTripModal({ trip, onClose }) {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const clean = username.trim()
    if (!clean) {
      setError('Escribe un nombre de usuario')
      return
    }

    setLoading(true)
    try {
      const userId = await findUserByUsername(clean)
      if (userId === user?.id) throw new Error('No puedes copiar el viaje a tu propia cuenta')
      await copyTripForUser(trip.id, userId)
      setSuccess(`Copia enviada a @${clean}`)
      setUsername('')
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('overlap') || msg.includes('trips_no_user_date_overlap')) {
        setError('Ese usuario ya tiene un viaje en esas fechas. Pídele que lo elimine o cambie las fechas antes de copiar.')
      } else {
        setError(err.message || 'No se pudo copiar el viaje')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-100 p-2 rounded-lg">
              <Copy className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Copiar viaje a alguien</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Escribe el nombre de usuario y se le creará una copia propia de <strong>{trip.destination}</strong>. Cada persona puede editar su versión sin afectar a las demás.
        </p>
        <p className="text-xs text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 mb-4">
          Se copian los datos del viaje y el itinerario, pero no la lista de packing. Así cada quien arma su propio equipaje.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ej: juanito_viajero"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 placeholder-gray-400"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Copiando...' : 'Copiar viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
