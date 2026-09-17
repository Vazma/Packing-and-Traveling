import { useState } from 'react'
import { Check, Luggage, Plane } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const benefits = [
  'Planea cada viaje según el clima y tu equipaje',
  'Elige qué llevar con sugerencias personalizadas',
  'Marca lo empacado y no olvides nada importante'
]

export default function Login({ onToggleRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(username, password)
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-sky-200 to-sky-400 p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-sky-700 to-sky-500 px-6 py-8 text-white sm:px-10 lg:flex lg:flex-col lg:justify-center lg:p-12">
          <Plane className="absolute -right-8 -top-8 h-40 w-40 rotate-12 text-white/10" strokeWidth={1.2} />
          <Luggage className="absolute -bottom-8 -left-6 h-36 w-36 -rotate-6 text-white/10" strokeWidth={1.2} />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Plane className="h-4 w-4" />
              Travel Companion
            </div>
            <h1 className="max-w-lg text-3xl font-bold leading-tight sm:text-4xl">
              Tu viaje empieza mucho antes de abordar
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-sky-50 sm:text-lg">
              Organiza tus viajes, prepara una lista pensada para ti y lleva el control de tu equipaje desde un solo lugar.
            </p>
            <ul className="mt-6 hidden space-y-3 sm:block">
              {benefits.map(benefit => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-sky-50 sm:text-base">
                  <span className="mt-0.5 rounded-full bg-white/20 p-1"><Check className="h-4 w-4" /></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:p-12">
          <div className="mb-7">
            <p className="mb-2 text-sm font-semibold text-sky-700">Continúa tu próxima aventura</p>
            <h2 className="text-3xl font-bold text-slate-900">Inicia sesión</h2>
            <p className="mt-2 text-slate-600">Accede a tus viajes y continúa justo donde te quedaste.</p>
          </div>

          {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Nombre de usuario</label>
              <input id="username" type="text" required autoComplete="username" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Escribe tu usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
              <input id="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Escribe tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3 font-semibold text-white transition hover:from-sky-700 hover:to-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Iniciando sesión...' : 'Entrar a mis viajes'}
            </button>
            <p className="pt-2 text-center text-sm text-slate-600">
              ¿Es tu primera vez aquí?{' '}
              <button type="button" onClick={onToggleRegister} className="font-semibold text-sky-700 transition-colors hover:text-sky-800">Crea tu cuenta</button>
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}
