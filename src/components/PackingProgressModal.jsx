import { useState, useEffect } from 'react'
import { getPackingTips, activityLabels } from '../lib/packingSuggestions'
import { loadTripItems, persistTripItems } from '../lib/packingStorage'
import { describeLuggage } from '../lib/luggage'
import CollapsibleSection from './CollapsibleSection'

const sectionTitles = {
  documents: 'Documentos y trámites',
  basic: 'Artículos básicos',
  weather_specific: 'Especiales para el clima',
  activity: 'Deportes y actividades',
  custom: 'Artículos personalizados'
}

export default function PackingProgressModal({ trip, onClose }) {
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [collapsedSections, setCollapsedSections] = useState({})
  const [hidePacked, setHidePacked] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadTripItems(trip.id).then(loadedItems => {
      setAllItems(loadedItems)
      setItems(loadedItems.filter(item => item.is_selected))
      setInitialized(true)
    }).catch(error => console.error('Error al cargar los artículos:', error))
  }, [trip.id])

  // Al guardar hay que conservar también los artículos no elegidos, que no se
  // muestran en este modal
  useEffect(() => {
    if (!initialized) return
    const updatedById = new Map(items.map(item => [item.id, item]))
    const updatedItems = allItems.map(item => updatedById.get(item.id) || item)
    persistTripItems(trip, updatedItems).catch(error => console.error('Error al guardar los artículos:', error))
  }, [trip, items, allItems, initialized])

  const toggleItem = (item) => {
    setItems(items.map(i => (
      i.id === item.id ? { ...i, is_packed: !i.is_packed } : i
    )))
  }

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const packedCount = items.filter(item => item.is_packed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0
  const tips = getPackingTips(trip)

  const groupLabel = (item) =>
    item.category === 'activity' && item.activity
      ? `${sectionTitles.activity} · ${activityLabels[item.activity] || item.activity}`
      : sectionTitles[item.category] || 'Otros'

  const groups = items.reduce((acc, item) => {
    const label = groupLabel(item)
    acc[label] = acc[label] || []
    acc[label].push(item)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Empacando para {trip.destination}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {trip.duration_days} días • Equipaje: {describeLuggage(trip)}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {/* Progreso de empacado */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de empacado</span>
              <span>{packedCount}/{totalCount} ({Math.round(progress)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-sky-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {totalCount > 0 && packedCount === totalCount && (
              <p className="mt-3 text-sm font-medium text-green-700">
                ¡Listo! Ya tienes todo en la maleta. Buen viaje.
              </p>
            )}
          </div>

          {/* Tips de empacado */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-sky-800 mb-2">Antes de cerrar la maleta:</h3>
            <ul className="text-sm text-sky-800 space-y-1">
              {tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>

          {totalCount === 0 ? (
            <p className="text-gray-600 mb-6">
              Todavía no has elegido nada. Abre "Elige tus artículos" y marca lo que quieres llevar
              en tu maleta.
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Tu lista</h3>
                <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hidePacked}
                    onChange={() => setHidePacked(!hidePacked)}
                    className="w-4 h-4 shrink-0 accent-sky-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Ocultar lo ya empacado</span>
                </label>
              </div>

              {Object.entries(groups).map(([label, groupItems]) => {
                const groupPacked = groupItems.filter(item => item.is_packed).length
                const visibleItems = hidePacked
                  ? groupItems.filter(item => !item.is_packed)
                  : groupItems
                if (visibleItems.length === 0) return null

                return (
                  <CollapsibleSection
                    key={label}
                    title={label}
                    badge={`${groupPacked}/${groupItems.length}`}
                    collapsed={!!collapsedSections[label]}
                    onToggle={() => toggleSection(label)}
                  >
                    <div className="divide-y divide-gray-100">
                      {visibleItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <label className="flex items-center space-x-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!item.is_packed}
                              onChange={() => toggleItem(item)}
                              className="w-5 h-5 shrink-0 accent-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                            />
                            <span className={item.is_packed ? 'line-through text-gray-400' : 'text-gray-900'}>
                              {item.name}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
