import { useState, useEffect, useMemo } from 'react'
import { getPackingSuggestions, activityLabels } from '../lib/packingSuggestions'
import {
  createId,
  loadTripItems,
  persistTripItems,
  mergeWithSuggestions,
  getPlanSignature
} from '../lib/packingStorage'
import { getWeatherLabel } from '../lib/labels'
import CollapsibleSection from './CollapsibleSection'

export default function PackingPlanModal({ trip, onClose }) {
  const suggestions = useMemo(() => getPackingSuggestions(trip), [trip])
  const [items, setItems] = useState([])
  const [customItem, setCustomItem] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    loadTripItems(trip.id).then(existingItems => {
      const signature = getPlanSignature(trip)
      const isUpToDate = existingItems.length > 0 &&
        existingItems.every(item => item.plan_signature === signature)

      setItems(isUpToDate
        ? existingItems.map(item => ({ ...item, id: item.id || createId() }))
        : mergeWithSuggestions(suggestions.items, existingItems))
      setInitialized(true)
    }).catch(error => console.error('Error al cargar los artículos:', error))
  }, [trip, suggestions])

  useEffect(() => {
    if (!initialized) return
    persistTripItems(trip, items).catch(error => console.error('Error al guardar los artículos:', error))
  }, [trip, items, initialized])

  const update = (updatedItems) => setItems(updatedItems)

  const toggleExpanded = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleItem = (item) => {
    update(items.map(i => (
      i.id === item.id ? { ...i, is_selected: !i.is_selected } : i
    )))
  }

  const toggleGroup = (groupItems, selectAll) => {
    const groupIds = new Set(groupItems.map(item => item.id))
    update(items.map(i => (
      groupIds.has(i.id) ? { ...i, is_selected: selectAll } : i
    )))
  }

  const addCustomItem = () => {
    if (!customItem.trim()) return
    update([
      ...items,
      {
        name: customItem.trim(),
        category: 'custom',
        is_selected: true,
        is_packed: false,
        id: createId()
      }
    ])
    setCustomItem('')
  }

  const removeItem = (item) => {
    update(items.filter(i => i.id !== item.id))
  }

  const selectedCount = items.filter(item => item.is_selected).length

  const renderItemRow = (item) => (
    <div
      key={item.id}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <label className="flex flex-1 items-center space-x-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!item.is_selected}
          onChange={() => toggleItem(item)}
          className="w-5 h-5 shrink-0 accent-sky-600 rounded focus:ring-sky-500 cursor-pointer"
        />
        <span className={item.is_selected ? 'text-gray-900 font-medium' : 'text-gray-700'}>
          {item.name}
        </span>
      </label>
      {item.category === 'custom' && (
        <button
          onClick={() => removeItem(item)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Eliminar
        </button>
      )}
    </div>
  )

  const renderGroupActions = (groupItems) => {
    const allSelected = groupItems.every(item => item.is_selected)
    return (
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <button
          type="button"
          onClick={() => toggleGroup(groupItems, !allSelected)}
          className="text-xs text-sky-600 hover:text-sky-700 font-medium"
        >
          {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
        </button>
      </div>
    )
  }

  const sections = [
    {
      key: 'documents',
      title: 'Documentos y trámites',
      description: 'Verifica los requisitos de entrada en la web oficial del país'
    },
    {
      key: 'basic',
      title: 'Artículos básicos',
      description: 'Lo que llevas sin importar el clima'
    },
    {
      key: 'weather_specific',
      title: `Especiales para clima ${getWeatherLabel(trip.weather).toLowerCase()}`,
      description: 'Pensados para las condiciones de tu destino'
    },
    {
      key: 'activity',
      title: 'Deportes y actividades al aire libre',
      description: 'Elige el deporte que piensas hacer'
    },
    {
      key: 'custom',
      title: 'Artículos personalizados',
      description: 'Los que agregas tú'
    }
  ]

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Elige tus artículos para {trip.destination}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {trip.duration_days} días • Clima: {getWeatherLabel(trip.weather)} • {selectedCount} artículos elegidos
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {suggestions?.tips?.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-slate-900 mb-2">Recomendaciones:</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {suggestions.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 mb-6">
            {sections.map((section) => {
              const sectionItems = items.filter(item => item.category === section.key)
              if (sectionItems.length === 0) return null

              const sectionSelected = sectionItems.filter(item => item.is_selected).length

              return (
                <CollapsibleSection
                  key={section.key}
                  title={section.title}
                  description={section.description}
                  badge={`${sectionSelected}/${sectionItems.length}`}
                  collapsed={!expandedSections[section.key]}
                  onToggle={() => toggleExpanded(section.key)}
                >
                  {section.key === 'activity' ? (
                    Object.entries(activityLabels).map(([activityKey, label]) => {
                      const activityGroup = sectionItems.filter(item => item.activity === activityKey)
                      if (activityGroup.length === 0) return null

                      const groupKey = `activity:${activityKey}`
                      const groupSelected = activityGroup.filter(item => item.is_selected).length

                      return (
                        <CollapsibleSection
                          key={groupKey}
                          title={label}
                          badge={`${groupSelected}/${activityGroup.length}`}
                          collapsed={!expandedSections[groupKey]}
                          onToggle={() => toggleExpanded(groupKey)}
                          compact
                        >
                          {renderGroupActions(activityGroup)}
                          <div className="divide-y divide-gray-100">
                            {activityGroup.map(renderItemRow)}
                          </div>
                        </CollapsibleSection>
                      )
                    })
                  ) : (
                    <>
                      {renderGroupActions(sectionItems)}
                      <div className="divide-y divide-gray-100">
                        {sectionItems.map(renderItemRow)}
                      </div>
                    </>
                  )}
                </CollapsibleSection>
              )
            })}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar artículo personalizado
          </label>
          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomItem()
                }
              }}
              placeholder="Ej: cámara, libro, adaptador de buceo..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={addCustomItem}
              className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800"
            >
              Agregar
            </button>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800"
            >
              Guardar lista
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
