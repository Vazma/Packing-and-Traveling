import { useState, useEffect } from 'react'
import { parseISO } from 'date-fns'
import {
  Landmark,
  Castle,
  Pyramid,
  FerrisWheel,
  MountainSnow,
  Palmtree,
  Plane,
  Luggage,
  Globe,
  Pencil,
  Trash2,
  ChevronDown,
  LogOut,
  Map,
  Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getWeatherLabel } from '../lib/labels'
import { describeLuggage } from '../lib/luggage'
import { loadUserTrips, deleteTrip } from '../lib/tripStorage'
import CreateTrip from './CreateTrip'
import PackingPlanModal from './PackingPlanModal'
import PackingProgressModal from './PackingProgressModal'
import ItineraryView from './ItineraryView'
import ShareTripModal from './ShareTripModal'

// Monumentos y motivos de viaje que decoran el fondo del dashboard
// En pantallas chicas se muestran menos piezas y más pequeñas para que no se encimen
const backgroundIcons = [
  { Icon: Landmark, className: 'w-24 h-24 sm:w-40 sm:h-40 top-[9%] left-[4%] -rotate-6' },
  { Icon: Castle, className: 'w-28 h-28 sm:w-48 sm:h-48 top-[6%] right-[5%] rotate-3' },
  { Icon: Plane, className: 'w-20 h-20 sm:w-36 sm:h-36 top-[32%] left-[6%] sm:top-[22%] sm:left-[52%] -rotate-12' },
  { Icon: Globe, className: 'w-20 h-20 sm:w-32 sm:h-32 top-[50%] right-[5%] sm:top-[60%] sm:right-[4%] rotate-2' },
  { Icon: FerrisWheel, className: 'w-20 h-20 sm:w-32 sm:h-32 bottom-[15%] left-[5%] sm:bottom-[16%] sm:left-[8%] rotate-6' },
  { Icon: MountainSnow, className: 'w-28 h-28 sm:w-52 sm:h-52 bottom-[4%] right-[5%] sm:bottom-[6%] sm:right-[8%] -rotate-2' },
  { Icon: Pyramid, className: 'hidden sm:block w-36 h-36 top-[46%] left-[18%] rotate-2' },
  { Icon: Palmtree, className: 'hidden sm:block w-28 h-28 top-[70%] left-[46%] rotate-3' },
  { Icon: Luggage, className: 'hidden sm:block w-24 h-24 bottom-[30%] right-[38%] rotate-6' },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [tripToDelete, setTripToDelete] = useState(null)
  const [planningTrip, setPlanningTrip] = useState(null)
  const [packingTrip, setPackingTrip] = useState(null)
  const [itineraryTrip, setItineraryTrip] = useState(null)
  const [shareTrip, setShareTrip] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTrips = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      setTrips(await loadUserTrips(user.id))
    } catch (error) {
      console.error('Error loading trips:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrips()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleTripSaved = () => {
    setShowCreateTrip(false)
    setEditingTrip(null)
    loadTrips()
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteTrip(tripToDelete.id)
      setTripToDelete(null)
      await loadTrips()
    } catch (error) {
      console.error('Error al eliminar el viaje:', error)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 overflow-hidden">
      {/* Fondo decorativo con monumentos y motivos de viaje */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {backgroundIcons.map(({ Icon, className }, index) => (
          <Icon key={index} strokeWidth={1.2} className={`absolute text-sky-800/[0.09] ${className}`} />
        ))}
      </div>

      <nav className="relative bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-2 rounded-lg shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-sky-600 to-sky-700 bg-clip-text text-transparent truncate">
                Travel Companion
              </h1>
            </div>
            <div className="flex items-center shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white text-xs font-semibold uppercase">
                    {(user?.username || 'U').charAt(0)}
                  </span>
                  <span className="text-sm text-slate-700 max-w-[120px] sm:max-w-none truncate">
                    {user?.username || 'Usuario'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showUserMenu && (
                  <>
                    {/* Capa para cerrar el menú al tocar fuera */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20"
                    >
                      <button
                        role="menuitem"
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Mis Viajes
              </h2>
              <p className="text-gray-600">
                Organiza y prepara tus próximas aventuras
              </p>
            </div>
            <button
              onClick={() => setShowCreateTrip(true)}
              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white font-medium rounded-lg hover:from-sky-700 hover:to-sky-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Crear Viaje</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 text-lg">Cargando tus viajes...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-100 to-slate-200 rounded-full mb-6">
                <svg className="w-10 h-10 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No tienes viajes aún
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Comienza creando tu primer viaje y recibe sugerencias personalizadas de empacado
              </p>
              <button
                onClick={() => setShowCreateTrip(true)}
                className="px-8 py-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white font-medium rounded-lg hover:from-sky-700 hover:to-sky-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Crear mi primer viaje
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-sky-500 to-sky-700"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-sky-600 transition-colors">
                          {trip.destination}
                        </h3>
                        {!trip.is_owner && (
                          <span className="text-xs text-sky-600 font-medium">Compartido contigo</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        {trip.is_owner && (
                          <>
                            <button
                              onClick={() => setShareTrip(trip)}
                              title="Copiar viaje a alguien"
                              aria-label={`Copiar viaje a ${trip.destination}`}
                              className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTrip(trip)}
                              title="Editar viaje"
                              aria-label={`Editar viaje a ${trip.destination}`}
                              className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTripToDelete(trip)}
                              title="Eliminar viaje"
                              aria-label={`Eliminar viaje a ${trip.destination}`}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 mb-4">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4 V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">
                        {parseISO(trip.start_date).toLocaleDateString()} - {parseISO(trip.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {trip.duration_days} días
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        {getWeatherLabel(trip.weather)}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {describeLuggage(trip)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setPlanningTrip(trip)}
                        className="w-full bg-gradient-to-r from-sky-600 to-sky-700 text-white py-3 px-4 rounded-lg font-medium hover:from-sky-700 hover:to-sky-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                      >
                        <span>Elige tus artículos</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setItineraryTrip(trip)}
                        className="w-full border border-sky-600 text-sky-700 py-3 px-4 rounded-lg font-medium hover:bg-sky-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Map className="w-4 h-4" />
                        <span>Itinerario</span>
                      </button>
                      <button
                        onClick={() => setPackingTrip(trip)}
                        disabled={!trip.selected_count}
                        title={trip.selected_count ? undefined : 'Primero elige tus artículos'}
                        className="w-full border border-sky-600 text-sky-700 py-3 px-4 rounded-lg font-medium hover:bg-sky-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Comenzar a empacar{trip.selected_count ? ` (${trip.selected_count})` : ''}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {(showCreateTrip || editingTrip) && (
        <CreateTrip
          trip={editingTrip}
          onTripSaved={handleTripSaved}
          onCancel={() => {
            setShowCreateTrip(false)
            setEditingTrip(null)
          }}
        />
      )}

      {tripToDelete && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Eliminar el viaje a {tripToDelete.destination}?
            </h3>
            <p className="text-gray-600 mb-6">
              Se borrará también su lista de artículos. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar viaje
              </button>
            </div>
          </div>
        </div>
      )}

      {planningTrip && (
        <PackingPlanModal
          trip={planningTrip}
          onClose={() => {
            setPlanningTrip(null)
            loadTrips() // Refresca el contador de artículos elegidos
          }}
        />
      )}

      {packingTrip && (
        <PackingProgressModal
          trip={packingTrip}
          onClose={() => {
            setPackingTrip(null)
            loadTrips()
          }}
        />
      )}

      {itineraryTrip && (
        <ItineraryView
          trip={itineraryTrip}
          onClose={() => setItineraryTrip(null)}
        />
      )}

      {shareTrip && (
        <ShareTripModal
          trip={shareTrip}
          onClose={() => {
            setShareTrip(null)
            loadTrips()
          }}
        />
      )}
    </div>
  )
}
