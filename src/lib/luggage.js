// El equipaje de un viaje puede ser una sola pieza (small | medium | large) o
// una combinación personalizada, p. ej. 2 maletas de cabina, o 1 de cabina + 1
// documentada. `luggage_pieces` guarda cuántas piezas de cada tipo se llevan.

export const luggagePieceLabels = {
  small: 'Mochila o artículo personal',
  medium: 'Maleta de cabina',
  large: 'Maleta documentada'
}

export const luggagePiecePlurals = {
  small: 'mochilas o artículos personales',
  medium: 'maletas de cabina',
  large: 'maletas documentadas'
}

const shortLabels = {
  small: 'Mochila',
  medium: 'Cabina',
  large: 'Documentada'
}

// Cuánto espacio aporta cada tipo de pieza
const pieceCapacity = {
  small: 1,
  medium: 2,
  large: 4
}

export const emptyPieces = { small: 0, medium: 0, large: 0 }

export const getLuggagePieces = (trip) => {
  const pieces = trip?.luggage_pieces
  if (pieces && Object.values(pieces).some(count => count > 0)) {
    return { ...emptyPieces, ...pieces }
  }
  // Viajes con una sola pieza (o creados antes de esta funcionalidad)
  return { ...emptyPieces, [trip?.luggage_size || 'medium']: 1 }
}

export const getLuggageCapacity = (trip) =>
  Object.entries(getLuggagePieces(trip))
    .reduce((total, [type, count]) => total + (pieceCapacity[type] || 0) * count, 0)

export const countLuggagePieces = (trip) =>
  Object.values(getLuggagePieces(trip)).reduce((total, count) => total + count, 0)

export const describeLuggage = (trip) => {
  const pieces = getLuggagePieces(trip)
  return Object.entries(pieces)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => (count > 1 ? `${shortLabels[type]} ×${count}` : shortLabels[type]))
    .join(' + ')
}
