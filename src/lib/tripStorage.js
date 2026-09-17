import { supabase } from './supabase'

export const loadUserTrips = async (userId) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*, packing_items(is_selected)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(({ packing_items, ...trip }) => ({
    ...trip,
    selected_count: packing_items.filter(item => item.is_selected).length
  }))
}

export const createTrip = async (userId, data) => {
  const { data: trip, error } = await supabase
    .from('trips')
    .insert({ user_id: userId, ...data })
    .select()
    .single()
  if (error) throw error
  return trip
}

export const updateTrip = async (tripId, data) => {
  const { data: trip, error } = await supabase
    .from('trips')
    .update(data)
    .eq('id', tripId)
    .select()
    .single()
  if (error) throw error
  return trip
}

export const deleteTrip = async tripId => {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}
