import { supabase } from './supabase'

const sortByDate = (a, b) => {
  if (a.arrival_date && b.arrival_date) {
    const dateCmp = a.arrival_date.localeCompare(b.arrival_date)
    if (dateCmp !== 0) return dateCmp
  }
  if (a.arrival_date && !b.arrival_date) return -1
  if (!a.arrival_date && b.arrival_date) return 1
  return a.order_index - b.order_index
}

const sortCities = list => [...list].sort(sortByDate)

const getEarliestDate = country => {
  for (const city of country.cities) {
    if (city.arrival_date) return city.arrival_date
  }
  return null
}

const sortCountries = (a, b) => {
  const aDate = getEarliestDate(a)
  const bDate = getEarliestDate(b)
  if (aDate && bDate) {
    const dateCmp = aDate.localeCompare(bDate)
    if (dateCmp !== 0) return dateCmp
  }
  if (aDate && !bDate) return -1
  if (!aDate && bDate) return 1
  return a.order_index - b.order_index
}

export const loadItinerary = async tripId => {
  const { data: countries, error: countriesError } = await supabase
    .from('trip_countries')
    .select('*')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true })

  if (countriesError) throw countriesError
  if (!countries || countries.length === 0) return []

  const countryIds = countries.map(c => c.id)
  const { data: cities, error: citiesError } = await supabase
    .from('trip_cities')
    .select('*')
    .in('country_id', countryIds)
    .order('order_index', { ascending: true })

  if (citiesError) throw citiesError

  const cityIds = (cities || []).map(c => c.id)
  let links = []
  if (cityIds.length > 0) {
    const { data, error: linksError } = await supabase
      .from('city_links')
      .select('*')
      .in('city_id', cityIds)
      .order('order_index', { ascending: true })

    if (linksError) throw linksError
    links = data || []
  }

  const linksByCity = new Map()
  for (const link of links) {
    const list = linksByCity.get(link.city_id) || []
    list.push(link)
    linksByCity.set(link.city_id, list)
  }

  const citiesByCountry = new Map()
  for (const city of cities || []) {
    const list = citiesByCountry.get(city.country_id) || []
    list.push({ ...city, links: sortCities(linksByCity.get(city.id) || []) })
    citiesByCountry.set(city.country_id, list)
  }

  const withCities = countries.map(country => ({
    ...country,
    cities: sortCities(citiesByCountry.get(country.id) || [])
  }))

  return [...withCities].sort(sortCountries)
}

export const addCountry = async (tripId, name) => {
  const { data: existing } = await supabase
    .from('trip_countries')
    .select('order_index')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order_index = existing ? existing.order_index + 1 : 0
  const { data, error } = await supabase
    .from('trip_countries')
    .insert({ trip_id: tripId, name, order_index })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCountry = async (countryId, name) => {
  const { data, error } = await supabase
    .from('trip_countries')
    .update({ name })
    .eq('id', countryId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCountry = async countryId => {
  const { error } = await supabase.from('trip_countries').delete().eq('id', countryId)
  if (error) throw error
}

export const addCity = async (countryId, { name, arrival_date, departure_date }) => {
  const { data: existing } = await supabase
    .from('trip_cities')
    .select('order_index')
    .eq('country_id', countryId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order_index = existing ? existing.order_index + 1 : 0
  const { data, error } = await supabase
    .from('trip_cities')
    .insert({
      country_id: countryId,
      name,
      arrival_date: arrival_date || null,
      departure_date: departure_date || null,
      order_index
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCity = async (cityId, name) => {
  const { data, error } = await supabase
    .from('trip_cities')
    .update({ name })
    .eq('id', cityId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCity = async cityId => {
  const { error } = await supabase.from('trip_cities').delete().eq('id', cityId)
  if (error) throw error
}

export const addLink = async (cityId, { type, name, url, notes }) => {
  const { data: existing } = await supabase
    .from('city_links')
    .select('order_index')
    .eq('city_id', cityId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order_index = existing ? existing.order_index + 1 : 0
  const { data, error } = await supabase
    .from('city_links')
    .insert({ city_id: cityId, type, name, url, notes, order_index })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateLink = async (linkId, { type, name, url, notes }) => {
  const { data, error } = await supabase
    .from('city_links')
    .update({ type, name, url, notes })
    .eq('id', linkId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteLink = async linkId => {
  const { error } = await supabase.from('city_links').delete().eq('id', linkId)
  if (error) throw error
}

export const copyItineraryToTrip = async (sourceTripId, targetTripId) => {
  const { data: sourceCountries, error: scError } = await supabase
    .from('trip_countries')
    .select('*')
    .eq('trip_id', sourceTripId)
    .order('order_index', { ascending: true })
  if (scError) throw scError
  if (!sourceCountries || sourceCountries.length === 0) return

  const { data: targetMax, error: tmError } = await supabase
    .from('trip_countries')
    .select('order_index')
    .eq('trip_id', targetTripId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (tmError) throw tmError

  const baseOrder = targetMax ? targetMax.order_index + 1 : 0

  const { data: newCountries, error: ncError } = await supabase
    .from('trip_countries')
    .insert(sourceCountries.map(c => ({
      trip_id: targetTripId,
      name: c.name,
      order_index: baseOrder + c.order_index,
    })))
    .select()
  if (ncError) throw ncError

  const countryMap = new Map()
  for (let i = 0; i < sourceCountries.length; i++) {
    countryMap.set(sourceCountries[i].id, newCountries[i].id)
  }

  const { data: sourceCities, error: sourceCitiesError } = await supabase
    .from('trip_cities')
    .select('*')
    .in('country_id', sourceCountries.map(c => c.id))
    .order('order_index', { ascending: true })
  if (sourceCitiesError) throw sourceCitiesError

  if (sourceCities && sourceCities.length > 0) {
    const cityRows = sourceCities.map(city => ({
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
    for (let i = 0; i < sourceCities.length; i++) {
      cityMap.set(sourceCities[i].id, newCities[i].id)
    }

    const { data: sourceLinks, error: sourceLinksError } = await supabase
      .from('city_links')
      .select('*')
      .in('city_id', sourceCities.map(c => c.id))
      .order('order_index', { ascending: true })
    if (sourceLinksError) throw sourceLinksError

    if (sourceLinks && sourceLinks.length > 0) {
      const linkRows = sourceLinks.map(link => ({
        city_id: cityMap.get(link.city_id),
        type: link.type,
        name: link.name,
        url: link.url,
        notes: link.notes,
        order_index: link.order_index,
      }))
      const { error: linksError } = await supabase.from('city_links').insert(linkRows)
      if (linksError) throw linksError
    }
  }
}
