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

export const copyItineraryToTrip = async (sourceTripId, targetTripId, mode = 'append') => {
  const { data: sourceCountries, error: scError } = await supabase
    .from('trip_countries')
    .select('*')
    .eq('trip_id', sourceTripId)
    .order('order_index', { ascending: true })
  if (scError) throw scError
  if (!sourceCountries || sourceCountries.length === 0) return

  if (mode === 'overwrite') {
    const { data: targetCountries, error: tcError } = await supabase
      .from('trip_countries')
      .select('id')
      .eq('trip_id', targetTripId)
    if (tcError) throw tcError

    if (targetCountries && targetCountries.length > 0) {
      const targetCountryIds = targetCountries.map(c => c.id)
      const { data: targetCities, error: tcyError } = await supabase
        .from('trip_cities')
        .select('id')
        .in('country_id', targetCountryIds)
      if (tcyError) throw tcyError

      if (targetCities && targetCities.length > 0) {
        const targetCityIds = targetCities.map(c => c.id)
        const { error: dlError } = await supabase
          .from('city_links')
          .delete()
          .in('city_id', targetCityIds)
        if (dlError) throw dlError
      }

      const { error: dcyError } = await supabase
        .from('trip_cities')
        .delete()
        .in('country_id', targetCountryIds)
      if (dcyError) throw dcyError

      const { error: dcError } = await supabase
        .from('trip_countries')
        .delete()
        .in('id', targetCountryIds)
      if (dcError) throw dcError
    }
  }

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

export const COUNTRY_CATALOG = [
  { name: 'Alemania', code: 'DE', flag: '🇩🇪', cities: ['Berlín', 'Múnich', 'Hamburgo', 'Colonia', 'Fráncfort'] },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', cities: ['Buenos Aires', 'Mendoza', 'Bariloche', 'Córdoba', 'Ushuaia'] },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', cities: ['Viena', 'Salzburgo', 'Innsbruck', 'Graz', 'Linz'] },
  { name: 'Bélgica', code: 'BE', flag: '🇧🇪', cities: ['Bruselas', 'Brujas', 'Gante', 'Amberes', 'Lieja'] },
  { name: 'Brasil', code: 'BR', flag: '🇧🇷', cities: ['Río de Janeiro', 'São Paulo', 'Salvador', 'Brasilia', 'Florianópolis'] },
  { name: 'Canadá', code: 'CA', flag: '🇨🇦', cities: ['Toronto', 'Vancouver', 'Montreal', 'Quebec', 'Calgary'] },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', cities: ['Santiago', 'Valparaíso', 'Puerto Natales', 'Concepción', 'La Serena'] },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', cities: ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Barranquilla'] },
  { name: 'Croacia', code: 'HR', flag: '🇭🇷', cities: ['Zagreb', 'Split', 'Dubrovnik', 'Zadar', 'Pula'] },
  { name: 'Dinamarca', code: 'DK', flag: '🇩🇰', cities: ['Copenhague', 'Aarhus', 'Odense', 'Aalborg', 'Roskilde'] },
  { name: 'Emiratos Árabes Unidos', code: 'AE', flag: '🇦🇪', cities: ['Dubái', 'Abu Dabi', 'Sharjah', 'Al Ain', 'Fujairah'] },
  { name: 'España', code: 'ES', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Granada'] },
  { name: 'Estados Unidos', code: 'US', flag: '🇺🇸', cities: ['Nueva York', 'Los Ángeles', 'San Francisco', 'Chicago', 'Miami'] },
  { name: 'Francia', code: 'FR', flag: '🇫🇷', cities: ['París', 'Lyon', 'Niza', 'Burdeos', 'Estrasburgo'] },
  { name: 'Grecia', code: 'GR', flag: '🇬🇷', cities: ['Atenas', 'Santorini', 'Mykonos', 'Tesalónica', 'Creta'] },
  { name: 'Hungría', code: 'HU', flag: '🇭🇺', cities: ['Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Eger'] },
  { name: 'India', code: 'IN', flag: '🇮🇳', cities: ['Nueva Delhi', 'Bombay', 'Jaipur', 'Agra', 'Varanasi'] },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', cities: ['Yakarta', 'Bali', 'Yogyakarta', 'Bandung', 'Surabaya'] },
  { name: 'Irlanda', code: 'IE', flag: '🇮🇪', cities: ['Dublín', 'Cork', 'Galway', 'Belfast', 'Limerick'] },
  { name: 'Islandia', code: 'IS', flag: '🇮🇸', cities: ['Reykjavík', 'Akureyri', 'Vík', 'Selfoss', 'Húsavík'] },
  { name: 'Italia', code: 'IT', flag: '🇮🇹', cities: ['Roma', 'Milán', 'Venecia', 'Florencia', 'Nápoles'] },
  { name: 'Japón', code: 'JP', flag: '🇯🇵', cities: ['Tokio', 'Kioto', 'Osaka', 'Yokohama', 'Hiroshima'] },
  { name: 'Malasia', code: 'MY', flag: '🇲🇾', cities: ['Kuala Lumpur', 'Penang', 'Malaca', 'Langkawi', 'Johor Bahru'] },
  { name: 'Marruecos', code: 'MA', flag: '🇲🇦', cities: ['Marrakech', 'Fez', 'Casablanca', 'Rabat', 'Tánger'] },
  { name: 'México', code: 'MX', flag: '🇲🇽', cities: ['Ciudad de México', 'Guadalajara', 'Cancún', 'Oaxaca', 'Mérida', 'Puebla', 'San Miguel de Allende', 'Guanajuato', 'Puerto Vallarta', 'Tulum', 'Playa del Carmen', 'Cozumel', 'Cabo San Lucas', 'San Cristóbal de las Casas', 'Morelia', 'Querétaro', 'Taxco', 'Cuernavaca', 'Zihuatanejo', 'Isla Mujeres'] },
  { name: 'Noruega', code: 'NO', flag: '🇳🇴', cities: ['Oslo', 'Bergen', 'Tromsø', 'Stavanger', 'Trondheim'] },
  { name: 'Nueva Zelanda', code: 'NZ', flag: '🇳🇿', cities: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch', 'Rotorua'] },
  { name: 'Países Bajos', code: 'NL', flag: '🇳🇱', cities: ['Amsterdam', 'Róterdam', 'La Haya', 'Utrecht', 'Maastricht', 'Eindhoven', 'Groninga', 'Leiden', 'Haarlem', 'Delft'] },
  { name: 'Panamá', code: 'PA', flag: '🇵🇦', cities: ['Ciudad de Panamá', 'Boquete', 'Bocas del Toro', 'Colón', 'David'] },
  { name: 'Perú', code: 'PE', flag: '🇵🇪', cities: ['Lima', 'Cusco', 'Arequipa', 'Puno', 'Trujillo'] },
  { name: 'Polonia', code: 'PL', flag: '🇵🇱', cities: ['Varsovia', 'Cracovia', 'Gdansk', 'Wroclaw', 'Poznan'] },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', cities: ['Lisboa', 'Oporto', 'Faro', 'Coimbra', 'Évora'] },
  { name: 'Reino Unido', code: 'GB', flag: '🇬🇧', cities: ['Londres', 'Edimburgo', 'Mánchester', 'Birmingham', 'Liverpool'] },
  { name: 'República Checa', code: 'CZ', flag: '🇨🇿', cities: ['Praga', 'Brno', 'Karlovy Vary', 'Ostrava', 'Český Krumlov'] },
  { name: 'Sudáfrica', code: 'ZA', flag: '🇿🇦', cities: ['Ciudad del Cabo', 'Johannesburgo', 'Durban', 'Pretoria', 'Port Elizabeth'] },
  { name: 'Suecia', code: 'SE', flag: '🇸🇪', cities: ['Estocolmo', 'Gotemburgo', 'Malmö', 'Upsala', 'Lund'] },
  { name: 'Suiza', code: 'CH', flag: '🇨🇭', cities: ['Zúrich', 'Ginebra', 'Lucerna', 'Berna', 'Interlaken'] },
  { name: 'Tailandia', code: 'TH', flag: '🇹🇭', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Ayutthaya'] },
  { name: 'Turquía', code: 'TR', flag: '🇹🇷', cities: ['Estambul', 'Capadocia', 'Antalya', 'Esmirna', 'Ankara'] },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾', cities: ['Montevideo', 'Punta del Este', 'Colonia del Sacramento', 'Piriápolis', 'La Paloma'] },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', cities: ['Hanói', 'Ciudad Ho Chi Minh', 'Da Nang', 'Hoi An', 'Hue'] },
]

const ADDITIONAL_CITIES = {
  'Alemania': ['Dresde', 'Leipzig', 'Núremberg', 'Heidelberg', 'Friburgo'],
  'Argentina': ['Salta', 'Mar del Plata', 'El Calafate', 'Puerto Madryn', 'San Juan'],
  'Austria': ['Hallstatt', 'Kitzbühel', 'Zell am See', 'Bregenz', 'Sankt Wolfgang'],
  'Bélgica': ['Namur', 'Lovaina', 'Ostende', 'Ypres', 'Mons'],
  'Brasil': ['Paraty', 'Ilhabela', 'Buzios', 'Foz do Iguaçu', 'Manaus'],
  'Canadá': ['Ottawa', 'Banff', 'Niagara Falls', 'Victoria', 'Halifax'],
  'Chile': ['San Pedro de Atacama', 'Punta Arenas', 'Viña del Mar', 'Chiloé', 'Arica'],
  'Colombia': ['San Andrés', 'Santa Marta', 'Villa de Leyva', 'Manizales', 'Pereira'],
  'Croacia': ['Hvar', 'Rovinj', 'Porec', 'Rijeka', 'Trogir'],
  'Dinamarca': ['Helsingor', 'Esbjerg', 'Sonderborg', 'Ribe', 'Aalborg'],
  'Emiratos Árabes Unidos': ['Ras Al Khaimah', 'Ajman', 'Umm Al Quwain', 'Liwa Oasis', 'Hatta'],
  'España': ['Málaga', 'Santiago de Compostela', 'Toledo', 'Córdoba', 'Bilbao'],
  'Estados Unidos': ['Las Vegas', 'Boston', 'Washington D.C.', 'Seattle', 'New Orleans'],
  'Francia': ['Marsella', 'Cannes', 'Colmar', 'Aviñón', 'Montpellier'],
  'Grecia': ['Rodas', 'Corfú', 'Kefalonia', 'Naxos', 'Paros'],
  'Hungría': ['Szentendre', 'Gyor', 'Sopron', 'Balatonfüred', 'Visegrád'],
  'India': ['Rishikesh', 'Goa', 'Udaipur', 'Amritsar', 'Jodhpur'],
  'Indonesia': ['Lombok', 'Gili Islands', 'Nusa Penida', 'Borobudur', 'Flores'],
  'Irlanda': ['Killarney', 'Kilkenny', 'Donegal', 'Dingle', 'Waterford'],
  'Islandia': ['Jokulsarlon', 'Hella', 'Höfn', 'Kirkjubaejarklaustur', 'Stykkishólmur'],
  'Italia': ['Verona', 'Amalfi', 'Cinque Terre', 'Pisa', 'Siena'],
  'Japón': ['Nara', 'Fukuoka', 'Sapporo', 'Okinawa', 'Kanazawa'],
  'Malasia': ['Kota Kinabalu', 'Cameron Highlands', 'Kuching', 'Taman Negara', 'Redang'],
  'Marruecos': ['Essaouira', 'Chefchaouen', 'Merzouga', 'Agadir', 'Ouarzazate'],
  'Noruega': ['Lofoten', 'Alesund', 'Geiranger', 'Flam', 'Kristiansand'],
  'Nueva Zelanda': ['Milford Sound', 'Wanaka', 'Franz Josef', 'Nelson', 'Bay of Islands'],
  'Panamá': ['El Valle de Antón', 'Guna Yala', 'Penonomé', 'Santiago', 'Chitré'],
  'Perú': ['Huaraz', 'Iquitos', 'Puerto Maldonado', 'Nazca', 'Paracas'],
  'Polonia': ['Zakopane', 'Wieliczka', 'Bialystok', 'Szczecin', 'Gdynia'],
  'Portugal': ['Sintra', 'Cascais', 'Madeira', 'Albufeira', 'Aveiro'],
  'Reino Unido': ['Glasgow', 'Oxford', 'Cambridge', 'Bath', 'York'],
  'República Checa': ['Telč', 'Kutná Hora', 'Olomouc', 'Plzeň', 'Hradec Králové'],
  'Sudáfrica': ['Stellenbosch', 'Hermanus', 'Knysna', 'Kruger', 'Oudtshoorn'],
  'Suecia': ['Kiruna', 'Visby', 'Are', 'Sigtuna', 'Jönköping'],
  'Suiza': ['Zermatt', 'Lausanne', 'Basel', 'St. Moritz', 'Lugano'],
  'Tailandia': ['Pattaya', 'Ko Samui', 'Ko Tao', 'Hua Hin', 'Kanchanaburi'],
  'Turquía': ['Bodrum', 'Pamukkale', 'Fethiye', 'Konya', 'Trabzon'],
  'Uruguay': ['Cabo Polonio', 'Salto', 'Paysandú', 'Tacuarembó', 'Carmelo'],
  'Vietnam': ['Halong Bay', 'Nha Trang', 'Phu Quoc', 'Sapa', 'Mui Ne']
}

export const getCitiesForCountry = (countryName) => {
  const country = COUNTRY_CATALOG.find(c => c.name === countryName)
  if (!country) return []
  const extra = ADDITIONAL_CITIES[countryName] || []
  const combined = [...new Set([...country.cities, ...extra])]
  return combined.slice(0, 10)
}


