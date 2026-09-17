import { supabase } from './supabase'

export const loadUserTrips = async (userId) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*, packing_items(is_selected)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map(({ packing_items, ...trip }) => ({
    ...trip,
    is_owner: true,
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

export const findUserByUsername = async (username) => {
  const { data, error } = await supabase.rpc('get_user_id_by_username', { username })
  if (error || !data) throw new Error('Usuario no encontrado')
  return data
}

export const copyTripForUser = async (sourceTripId, targetUserId) => {
  const { data: source, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', sourceTripId)
    .single()
  if (error || !source) throw new Error('Viaje no encontrado')

  const { data: newTrip, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: targetUserId,
      destination: source.destination,
      start_date: source.start_date,
      end_date: source.end_date,
      weather: source.weather,
      luggage_size: source.luggage_size,
      luggage_pieces: source.luggage_pieces,
      duration_days: source.duration_days,
    })
    .select()
    .single()
  if (tripError) throw tripError

  const newTripId = newTrip.id

  try {
    const { data: countries, error: countriesError } = await supabase
      .from('trip_countries')
      .select('*')
      .eq('trip_id', sourceTripId)
      .order('order_index', { ascending: true })
    if (countriesError) throw countriesError

    if (countries && countries.length > 0) {
      const { data: newCountries, error: newCountriesError } = await supabase
        .from('trip_countries')
        .insert(countries.map(c => ({ trip_id: newTripId, name: c.name, order_index: c.order_index })))
        .select()
      if (newCountriesError) throw newCountriesError

      const countryMap = new Map()
      for (let i = 0; i < countries.length; i++) {
        countryMap.set(countries[i].id, newCountries[i].id)
      }

      const { data: cities, error: citiesError } = await supabase
        .from('trip_cities')
        .select('*')
        .in('country_id', countries.map(c => c.id))
        .order('order_index', { ascending: true })
      if (citiesError) throw citiesError

      if (cities && cities.length > 0) {
        const cityRows = cities.map(city => ({
          country_id: countryMap.get(city.country_id),
          name: city.name,
          arrival_date: city.arrival_date,
          departure_date: city.departure_date,
          order_index: city.order_index,
        }))
        const { data: newCities, error: newCitiesError } = await supabase
          .from('trip_cities')
          .insert(cityRows)
          .select()
        if (newCitiesError) throw newCitiesError

        const cityMap = new Map()
        for (let i = 0; i < cities.length; i++) {
          cityMap.set(cities[i].id, newCities[i].id)
        }

        const { data: links, error: linksError } = await supabase
          .from('city_links')
          .select('*')
          .in('city_id', cities.map(c => c.id))
          .order('order_index', { ascending: true })
        if (linksError) throw linksError

        if (links && links.length > 0) {
          const linkRows = links.map(link => ({
            city_id: cityMap.get(link.city_id),
            type: link.type,
            name: link.name,
            url: link.url,
            notes: link.notes,
            order_index: link.order_index,
          }))
          const { error: linksInsertError } = await supabase.from('city_links').insert(linkRows)
          if (linksInsertError) throw linksInsertError
        }
      }
    }

    return newTrip
  } catch (err) {
    await supabase.from('trips').delete().eq('id', newTripId)
    throw err
  }
}
