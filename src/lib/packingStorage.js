import { supabase } from './supabase'
import { CATALOG_VERSION } from './packingSuggestions'
import { getLuggagePieces } from './luggage'

export const createId = () => crypto.randomUUID()

export const loadTripItems = async tripId => {
  const { data, error } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at')
  if (error) throw error
  return data
}

export const removeTripItems = async tripId => {
  const { error } = await supabase.from('packing_items').delete().eq('trip_id', tripId)
  if (error) throw error
}

export const getPlanSignature = (trip) => {
  const { small, medium, large } = getLuggagePieces(trip)
  return `${CATALOG_VERSION}|${trip.weather}|${small}-${medium}-${large}|${trip.duration_days}`
}

export const persistTripItems = async (trip, items) => {
  const rows = items.map(item => ({
    id: item.id,
    trip_id: trip.id,
    name: item.name,
    category: item.category,
    activity: item.activity || null,
    is_selected: !!item.is_selected,
    is_packed: !!item.is_packed,
    plan_signature: getPlanSignature(trip)
  }))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from('packing_items').upsert(rows)
    if (upsertError) throw upsertError

    const ids = rows.map(item => item.id)
    const { error: deleteError } = await supabase
      .from('packing_items')
      .delete()
      .eq('trip_id', trip.id)
      .not('id', 'in', `(${ids.join(',')})`)
    if (deleteError) throw deleteError
  } else {
    await removeTripItems(trip.id)
  }
}

export const mergeWithSuggestions = (suggestedItems, previousItems = []) => {
  const previousByName = new Map(previousItems.map(item => [item.name, item]))

  return [
    ...suggestedItems.map(item => {
      const previous = previousByName.get(item.name)
      return {
        ...item,
        is_selected: !!previous?.is_selected,
        is_packed: !!previous?.is_packed,
        id: previous?.id || createId()
      }
    }),
    ...previousItems.filter(item => item.category === 'custom')
  ]
}
