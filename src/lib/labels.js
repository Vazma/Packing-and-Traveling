const weatherLabels = {
  hot: 'Calor',
  cold: 'Frío',
  rainy: 'Lluvioso',
  mild: 'Templado'
}

export const getWeatherLabel = (weather) => weatherLabels[weather] || weather
