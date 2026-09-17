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

const assertNoOverlappingTrip = async (userId, data, excludedTripId) => {
  let query = supabase
    .from('trips')
    .select('id, destination, start_date, end_date')
    .eq('user_id', userId)
    .lte('start_date', data.end_date)
    .gte('end_date', data.start_date)
    .limit(1)

  if (excludedTripId) query = query.neq('id', excludedTripId)

  const { data: overlappingTrips, error } = await query
  if (error) throw error
  if (overlappingTrips.length > 0) {
    const overlappingTrip = overlappingTrips[0]
    throw new Error(`Las fechas coinciden con tu viaje a ${overlappingTrip.destination} (${overlappingTrip.start_date} al ${overlappingTrip.end_date})`)
  }
}

const throwTripError = error => {
  if (error.code === '23P01') throw new Error('Ya tienes otro viaje programado durante esas fechas')
  throw error
}

export const createTrip = async (userId, data) => {
  await assertNoOverlappingTrip(userId, data)
  const { data: trip, error } = await supabase
    .from('trips')
    .insert({ user_id: userId, ...data })
    .select()
    .single()
  if (error) throwTripError(error)
  return trip
}

export const updateTrip = async (tripId, userId, data) => {
  await assertNoOverlappingTrip(userId, data, tripId)
  const { data: trip, error } = await supabase
    .from('trips')
    .update(data)
    .eq('id', tripId)
    .select()
    .single()
  if (error) throwTripError(error)
  return trip
}

export const deleteTrip = async tripId => {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}
