import {
  getLuggageCapacity,
  getLuggagePieces,
  countLuggagePieces,
  luggagePiecePlurals
} from './luggage'

// Sube este número al cambiar el catálogo: las listas ya guardadas con una
// versión anterior se regeneran automáticamente
export const CATALOG_VERSION = 5

// Prioridades: 1 = esencial, 2 = recomendado, 3 = opcional (solo si sobra espacio)
const ESSENTIAL = 1
const RECOMMENDED = 2
const OPTIONAL = 3

const basic = (name, priority) => ({ name, category: 'basic', priority })
const weather = (name, priority) => ({ name, category: 'weather_specific', priority })
const doc = (name, priority) => ({ name, category: 'documents', priority })

// Documentos, trámites y dinero. Genérico a propósito: las reglas de visado
// cambian con frecuencia, así que se recuerda verificar en la fuente oficial.
const documentItems = [
  // Identidad y permisos
  doc('Pasaporte (con al menos 6 meses de vigencia)', ESSENTIAL),
  doc('Identificación oficial (INE, DNI o similar)', ESSENTIAL),
  doc('Visa o autorización electrónica, si tu destino la pide (ESTA, ETA, ETIAS...)', ESSENTIAL),
  doc('Verificar requisitos de entrada en la web oficial del país', ESSENTIAL),
  doc('Licencia de conducir (y permiso internacional si vas a rentar coche)', RECOMMENDED),
  doc('Carnet de vacunación, si el destino lo exige', OPTIONAL),
  // Reservaciones e itinerario
  doc('Boletos de avión, tren o autobús', ESSENTIAL),
  doc('Reservación del hospedaje', ESSENTIAL),
  doc('Reservaciones de tours, entradas y renta de coche', RECOMMENDED),
  doc('Itinerario compartido con alguien de confianza', RECOMMENDED),
  doc('Comprobante de domicilio o carta de invitación, si te la piden', OPTIONAL),
  // Dinero
  doc('Efectivo en moneda local', ESSENTIAL),
  doc('Tarjetas de crédito o débito', ESSENTIAL),
  doc('Avisar al banco que vas a viajar', RECOMMENDED),
  doc('Una tarjeta de respaldo guardada en otro lugar', RECOMMENDED),
  // Salud y respaldos
  doc('Seguro de viaje o póliza médica internacional', RECOMMENDED),
  doc('Copias digitales de todo en la nube', RECOMMENDED),
  doc('Fotos de los documentos en el celular', RECOMMENDED),
  doc('Contactos de emergencia y del consulado', RECOMMENDED),
  doc('Receta médica de los medicamentos que llevas', OPTIONAL),
]

// Artículos útiles en cualquier clima
const getBasicItems = (clothesCount) => [
  // Ropa base
  basic(`Ropa interior (${clothesCount} piezas)`, ESSENTIAL),
  basic(`Calcetines (${clothesCount} pares)`, ESSENTIAL),
  basic(`Camisetas (${clothesCount})`, ESSENTIAL),
  basic('Tenis cómodos para caminar', ESSENTIAL),
  basic('Pijama', RECOMMENDED),
  basic('Bolsa para ropa sucia', RECOMMENDED),
  // Higiene
  basic('Cepillo y pasta de dientes', ESSENTIAL),
  basic('Desodorante', ESSENTIAL),
  basic('Champú y acondicionador (tamaño viaje)', RECOMMENDED),
  basic('Jabón o gel de baño', RECOMMENDED),
  basic('Toalla de microfibra', RECOMMENDED),
  basic('Peine o cepillo', OPTIONAL),
  basic('Cortaúñas y pinzas', OPTIONAL),
  basic('Perfume', OPTIONAL),
  // Salud
  basic('Medicamentos personales', ESSENTIAL),
  basic('Botiquín básico (analgésicos, curitas, antiácido)', RECOMMENDED),
  basic('Gel desinfectante de manos', OPTIONAL),
  // Electrónica
  basic('Cargador de celular', ESSENTIAL),
  basic('Power bank', RECOMMENDED),
  basic('Auriculares', RECOMMENDED),
  basic('Adaptador de corriente universal', RECOMMENDED),
  // Extras
  basic('Botella de agua reutilizable', RECOMMENDED),
  basic('Mochila pequeña plegable para el día', OPTIONAL),
  basic('Candado TSA', OPTIONAL),
  basic('Tapones para oídos y antifaz', OPTIONAL),
  basic('Snacks para el trayecto', OPTIONAL),
]

// Artículos específicos según el clima
const weatherItems = {
  hot: [
    weather('Ropa ligera y transpirable (algodón o lino)', ESSENTIAL),
    weather('Shorts o faldas', ESSENTIAL),
    weather('Traje de baño', ESSENTIAL),
    weather('Sandalias o chanclas', ESSENTIAL),
    weather('Lentes de sol con protección UV', ESSENTIAL),
    weather('Gorra o sombrero de ala ancha', ESSENTIAL),
    weather('Protector solar SPF 50', ESSENTIAL),
    weather('Bálsamo labial con SPF', RECOMMENDED),
    weather('Repelente de insectos', RECOMMENDED),
    weather('Camisa ligera de manga larga (protección solar)', RECOMMENDED),
    weather('Toalla de playa o de microfibra', RECOMMENDED),
    weather('Suero oral o bebida con electrolitos', RECOMMENDED),
    weather('Aloe vera o crema after sun', RECOMMENDED),
    weather('Ropa holgada para las horas de más calor', OPTIONAL),
    weather('Abanico o ventilador portátil USB', OPTIONAL),
    weather('Crema o talco antirozaduras', OPTIONAL),
    weather('Bolsa impermeable para el celular (playa o alberca)', OPTIONAL),
  ],
  cold: [
    // Capa 1: base térmica (segunda piel, transpirable)
    weather('Camisetas térmicas de manga larga (lana merino o sintética) x2-3', ESSENTIAL),
    weather('Mallas o pantalón térmico x2', ESSENTIAL),
    weather('Ropa interior transpirable (evita el algodón, retiene el sudor)', ESSENTIAL),
    // Capa 2: aislante
    weather('Forro polar o suéter de lana', ESSENTIAL),
    weather('Chaqueta de plumón o aislante (capa media compresible)', ESSENTIAL),
    weather('Pantalones abrigados o forrados (la mezclilla sola no basta)', ESSENTIAL),
    // Capa 3: exterior
    weather('Chaqueta impermeable y cortaviento (tipo Gore-Tex)', ESSENTIAL),
    weather('Pantalón impermeable (nieve o lluvia)', RECOMMENDED),
    // Extremidades: por donde se pierde más calor
    weather('Gorro que cubra las orejas', ESSENTIAL),
    weather('Guantes o manoplas aislantes (las manoplas abrigan más)', ESSENTIAL),
    weather('Guantes delgados táctiles para usar el celular sin destaparte', RECOMMENDED),
    weather('Bufanda o cuello térmico (buff)', ESSENTIAL),
    weather('Calcetines térmicos de lana merino (3-4 pares)', ESSENTIAL),
    weather('Botas impermeables con suela antideslizante', ESSENTIAL),
    weather('Calzado cómodo para interiores', RECOMMENDED),
    // Piel: el frío y la calefacción secan mucho
    weather('Crema hidratante densa (cara y cuerpo)', RECOMMENDED),
    weather('Crema de manos', RECOMMENDED),
    weather('Bálsamo labial con SPF (el viento agrieta en horas)', RECOMMENDED),
    weather('Protector solar SPF 50 (la nieve refleja hasta el 80% del UV)', RECOMMENDED),
    weather('Lentes de sol polarizados para el reflejo de la nieve', RECOMMENDED),
    weather('Spray nasal salino (la calefacción reseca mucho el ambiente)', OPTIONAL),
    // Confort y extras
    weather('Termo para bebidas calientes', RECOMMENDED),
    weather('Pijama abrigado y calcetines para dormir', RECOMMENDED),
    weather('Calentadores desechables de manos y pies', OPTIONAL),
    weather('Plantillas térmicas', OPTIONAL),
    weather('Tacos antideslizantes (crampones ligeros) para hielo', OPTIONAL),
    weather('Polainas para que no entre nieve en las botas', OPTIONAL),
    weather('Goggles de esquí (si hay nieve o viento fuerte)', OPTIONAL),
    weather('Spray impermeabilizante para las botas', OPTIONAL),
    weather('Bolsas de compresión para el abrigo y las capas', OPTIONAL),
  ],
  rainy: [
    weather('Impermeable con capucha', ESSENTIAL),
    weather('Paraguas compacto resistente al viento', ESSENTIAL),
    weather('Calzado impermeable o botas de agua', ESSENTIAL),
    weather('Ropa de secado rápido (evita algodón y mezclilla)', ESSENTIAL),
    weather('Calcetines de repuesto (pares extra)', ESSENTIAL),
    weather('Bolsas estancas o ziplock para electrónica y documentos', ESSENTIAL),
    weather('Funda impermeable para la mochila', RECOMMENDED),
    weather('Segundo par de zapatos para alternar mientras secan', RECOMMENDED),
    weather('Pantalón impermeable', RECOMMENDED),
    weather('Bolsa para guardar ropa mojada', RECOMMENDED),
    weather('Toalla de microfibra extra', RECOMMENDED),
    weather('Gorra con visera para llevar bajo la capucha', OPTIONAL),
    weather('Spray impermeabilizante para el calzado', OPTIONAL),
    weather('Chanclas para secar los pies o la ducha', OPTIONAL),
    weather('Paño de microfibra para lentes y pantallas', OPTIONAL),
  ],
  mild: [
    weather('Chaqueta ligera cortaviento', ESSENTIAL),
    weather('Suéter o cárdigan para hacer capas', ESSENTIAL),
    weather('Camisas de manga larga', ESSENTIAL),
    weather('Pantalones cómodos o de mezclilla', ESSENTIAL),
    weather('Tenis para caminar', ESSENTIAL),
    weather('Paraguas plegable pequeño', RECOMMENDED),
    weather('Bufanda ligera', RECOMMENDED),
    weather('Lentes de sol', RECOMMENDED),
    weather('Chaleco o segunda capa fina', OPTIONAL),
    weather('Un conjunto algo más formal para salir de noche', OPTIONAL),
  ],
}

// Deportes y actividades al aire libre: nada se sugiere por defecto, el usuario
// elige qué piensa hacer en el viaje
const activity = (name, activityKey) => ({ name, category: 'activity', activity: activityKey })

export const activityLabels = {
  running: 'Correr',
  cycling: 'Ciclismo',
  hiking: 'Senderismo / hiking',
  swimming: 'Natación',
}

const activityItems = [
  // Correr
  activity('Tenis de running (ya rodados)', 'running'),
  activity('Camiseta técnica transpirable', 'running'),
  activity('Shorts o mallas de running', 'running'),
  activity('Calcetines técnicos antiampollas', 'running'),
  activity('Ropa interior deportiva', 'running'),
  activity('Cortavientos ligero y plegable', 'running'),
  activity('Gorra o visera', 'running'),
  activity('Reloj GPS o pulsera + su cargador', 'running'),
  activity('Auriculares deportivos', 'running'),
  activity('Cangurera o cinturón de hidratación', 'running'),
  activity('Vaselina o crema antirozaduras', 'running'),
  activity('Geles o barritas energéticas', 'running'),
  activity('Banda reflectante o luz LED (correr de noche)', 'running'),
  activity('Pelota de masaje o mini foam roller', 'running'),

  // Ciclismo
  activity('Casco', 'cycling'),
  activity('Short de ciclismo con badana', 'cycling'),
  activity('Jersey o camiseta técnica de ciclismo', 'cycling'),
  activity('Guantes de ciclismo', 'cycling'),
  activity('Lentes deportivos', 'cycling'),
  activity('Zapatos de ciclismo y calas (clips)', 'cycling'),
  activity('Calcetines de ciclismo', 'cycling'),
  activity('Bidones de agua', 'cycling'),
  activity('Kit de reparación (cámara, parches, desmontables)', 'cycling'),
  activity('Bomba de aire portátil o cartuchos de CO2', 'cycling'),
  activity('Multiherramienta', 'cycling'),
  activity('Luces delantera y trasera + cargador', 'cycling'),
  activity('Crema de badana', 'cycling'),
  activity('Chaqueta impermeable ligera', 'cycling'),
  activity('Candado', 'cycling'),
  activity('Funda o caja de transporte para la bici', 'cycling'),

  // Senderismo / hiking
  activity('Botas o tenis de trekking ya domados', 'hiking'),
  activity('Calcetines de trekking (y un par de repuesto)', 'hiking'),
  activity('Mochila de día de 20-30 L', 'hiking'),
  activity('Hidratación para 2 L (bolsa o botellas)', 'hiking'),
  activity('Chubasquero y cortaviento', 'hiking'),
  activity('Bastones de trekking plegables', 'hiking'),
  activity('Mapa offline descargado o GPS', 'hiking'),
  activity('Lámpara frontal o linterna con pilas de repuesto', 'hiking'),
  activity('Kit para ampollas (curitas, gasas y cinta médica)', 'hiking'),
  activity('Protector solar, gorra y lentes de sol', 'hiking'),
  activity('Snacks y frutos secos', 'hiking'),
  activity('Navaja multiusos (va en la maleta documentada)', 'hiking'),
  activity('Manta térmica de emergencia', 'hiking'),
  activity('Silbato', 'hiking'),
  activity('Repelente de insectos', 'hiking'),
  activity('Bolsa para bajar tu basura', 'hiking'),

  // Natación
  activity('Traje de baño (2 si nadas a diario)', 'swimming'),
  activity('Goggles de natación y antiempañante', 'swimming'),
  activity('Gorro de natación', 'swimming'),
  activity('Toalla de microfibra para la alberca', 'swimming'),
  activity('Chanclas para la alberca', 'swimming'),
  activity('Tapones para los oídos y pinza nasal', 'swimming'),
  activity('Bolsa impermeable para el traje de baño mojado', 'swimming'),
  activity('Protector solar resistente al agua', 'swimming'),
  activity('Champú y gel para después del cloro', 'swimming'),
  activity('Material de entrenamiento (pull buoy, palas, tabla)', 'swimming'),
  activity('Neopreno y boya de seguridad (aguas abiertas)', 'swimming'),
  activity('Reloj acuático', 'swimming'),
]

const weatherTips = {
  hot: ['Calor: bebe agua con frecuencia y reaplica el protector solar cada 2 horas.'],
  cold: [
    'Frío: usa las tres capas (térmica + aislante + impermeable cortaviento) en lugar de una sola prenda gruesa.',
    'Lleva el power bank en un bolsillo interior: con frío la batería se agota 2-3 veces más rápido.',
    'Ponte el abrigo y las botas para viajar: es lo que más volumen ocupa en la maleta.',
  ],
  rainy: ['Lluvia: prioriza tejidos de secado rápido; el algodón y la mezclilla tardan horas en secar.'],
  mild: ['Templado: las capas ligeras te cubren mañanas frescas y tardes cálidas.'],
}

// Nivel máximo de prioridad y mudas de ropa según el espacio total disponible
// (una mochila = 1, una maleta de cabina = 2, una documentada = 4)
const getCapacityLevel = (capacity) => {
  if (capacity <= 1) {
    return {
      maxPriority: ESSENTIAL,
      clothesCap: 4,
      message: 'Vas ligero: solo lo esencial y todo combinable entre sí.'
    }
  }
  if (capacity <= 3) {
    return {
      maxPriority: RECOMMENDED,
      clothesCap: 7,
      message: 'Espacio moderado: lo esencial más algo de comodidad.'
    }
  }
  return {
    maxPriority: OPTIONAL,
    clothesCap: 10,
    message: 'Tienes espacio de sobra: puedes llevar también los extras opcionales.'
  }
}

const durationMessages = {
  short: 'Viaje corto (1-3 días): una muda por día y listo.',
  medium: 'Viaje medio (4-7 días): repite prendas neutras para no cargar de más.',
  long: 'Viaje largo (8+ días): planea lavar ropa a mitad del viaje en lugar de duplicar el equipaje.',
}

export function getPackingSuggestions(trip) {
  const { weather: tripWeather, duration_days } = trip

  let durationCategory = 'short'
  if (duration_days >= 4 && duration_days <= 7) {
    durationCategory = 'medium'
  } else if (duration_days >= 8) {
    durationCategory = 'long'
  }

  const capacity = getLuggageCapacity(trip)
  const luggageConfig = getCapacityLevel(capacity)

  // En viajes cortos no tiene sentido cargar con los opcionales
  const maxPriority = durationCategory === 'short'
    ? Math.min(luggageConfig.maxPriority, RECOMMENDED)
    : luggageConfig.maxPriority

  // Cantidad de mudas: una por día, con techo según el espacio disponible
  const clothesCount = Math.min(Math.max(duration_days, 2), luggageConfig.clothesCap)

  const items = [
    // Los documentos no se recortan por espacio: el pasaporte va igual
    ...documentItems,
    ...[
      ...getBasicItems(clothesCount),
      ...(weatherItems[tripWeather] || []),
    ].filter(item => item.priority <= maxPriority),
    // Las actividades se ofrecen completas: es el usuario quien elige su deporte
    ...activityItems,
  ]

  const tips = [
    luggageConfig.message,
    durationMessages[durationCategory],
    ...(weatherTips[tripWeather] || []),
  ]

  if (durationCategory === 'long' && capacity <= 1) {
    tips.push('Con mochila y muchos días: lleva detergente de viaje y lava a mano cada 3-4 días.')
  }

  const pieces = getLuggagePieces(trip)
  if (pieces.large > 0 && pieces.small + pieces.medium > 0) {
    tips.push('Llevas equipaje de mano y documentado: reparte una muda completa en el de mano por si el otro se retrasa.')
  }
  if (countLuggagePieces(trip) > 1) {
    tips.push('Con varias piezas, agrupa por tema (ropa en una, calzado y baño en otra) para no abrir todo al buscar algo.')
  }

  return { items, tips }
}

// Reglas y límites útiles durante el empacado (no al elegir qué llevar)
const luggageRules = {
  small: [
    'Mochila o artículo personal: lo habitual son 7-10 kg y unos 40x30x20 cm. Verifica la medida de tu aerolínea.',
  ],
  medium: [
    'Maleta de cabina: normalmente 55x40x20-25 cm y 8-10 kg. Pésala en casa antes de salir.',
  ],
  large: [
    'Maleta documentada: el límite habitual es 23 kg y 158 cm sumando largo + ancho + alto.',
    'Pon los líquidos grandes aquí, en bolsas cerradas: si se abren, no arruinan la ropa.',
  ],
}

export function getPackingTips(trip) {
  const pieces = getLuggagePieces(trip)

  // Una regla por cada tipo de pieza que se lleva, indicando cuántas hay
  const rules = Object.entries(pieces)
    .filter(([, count]) => count > 0)
    .flatMap(([type, count]) => (
      count > 1
        ? [`Llevas ${count} ${luggagePiecePlurals[type]}: el límite de peso y medidas aplica a cada una por separado.`, ...luggageRules[type]]
        : luggageRules[type]
    ))

  const cabinOnly = pieces.large === 0
  const liquidsRule = cabinOnly
    ? 'Líquidos: envases de 100 ml como máximo, todos dentro de una bolsa transparente resellable de 1 litro.'
    : 'Líquidos en cabina: envases de 100 ml como máximo en bolsa transparente de 1 litro; los tamaños grandes van en la documentada.'

  return [
    ...rules,
    liquidsRule,
    cabinOnly
      ? 'Tijeras, navajas y objetos punzantes no pasan el control: sin equipaje documentado, déjalos en casa.'
      : 'Tijeras, navajas y objetos punzantes solo en la maleta documentada.',
    'Baterías externas y power banks siempre en cabina: no pueden ir en la maleta documentada.',
    'Medicamentos, documentos y electrónica de valor van contigo en cabina.',
    'Enrolla la ropa en vez de doblarla: ocupa menos y se arruga menos.',
    'Coloca lo más pesado abajo, del lado de las ruedas, para que la maleta no se venza.',
    'Aprovecha huecos: mete calcetines y cargadores dentro de los zapatos.',
    ...(trip.weather === 'cold'
      ? ['Ponte el abrigo y las botas para viajar: es lo que más volumen ocupa.']
      : []),
  ]
}
