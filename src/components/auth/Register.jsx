import { useState } from 'react'
import { CalendarPlus, Check, Luggage, Plane } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const steps = [
  ['1', 'Crea tu viaje', 'Agrega destino, fechas, clima y tipo de equipaje.'],
  ['2', 'Personaliza tu lista', 'Elige documentos, básicos, ropa y actividades.'],
  ['3', 'Empaca sin estrés', 'Marca cada artículo y consulta tu progreso.']
]

export default function Register({ onToggleLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(username, password)
    } catch (err) {
      setError(err.message || 'Error al registrarse')
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
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Planea, elige y empaca</h1>
            <p className="mt-4 text-sky-50">Te acompañamos paso a paso para que prepares tu próximo viaje con tranquilidad.</p>
            <div className="mt-7 hidden space-y-4 sm:block">
              {steps.map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-bold text-sky-700">{number}</span>
                  <div><p className="font-semibold">{title}</p><p className="text-sm text-sky-100">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:p-12">
          <div className="mb-7">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><CalendarPlus className="h-6 w-6" /></div>
            <h2 className="text-3xl font-bold text-slate-900">Crea tu cuenta</h2>
            <p className="mt-2 text-slate-600">Solo necesitas un usuario y una contraseña. Al entrar, crearás tu primer viaje.</p>
          </div>

          {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">Elige un nombre de usuario</label>
              <input id="username" type="text" required minLength={3} maxLength={30} autoComplete="username" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Ejemplo: juanito_viajero" value={username} onChange={(e) => setUsername(e.target.value)} />
              <p className="mt-2 text-xs text-slate-500">Usa de 3 a 30 letras, números, puntos, guiones o guiones bajos.</p>
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Crea una contraseña</label>
              <input id="password" type="password" required minLength={6} autoComplete="new-password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-900"><Check className="mt-0.5 h-4 w-4 shrink-0" /><span>Tu cuenta se crea gratis y tus viajes se guardan para que puedas consultarlos desde tu celular.</span></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3 font-semibold text-white transition hover:from-sky-700 hover:to-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Creando tu cuenta...' : 'Crear cuenta y planear mi viaje'}
            </button>
            <p className="pt-2 text-center text-sm text-slate-600">¿Ya tienes una cuenta?{' '}<button type="button" onClick={onToggleLogin} className="font-semibold text-sky-700 transition-colors hover:text-sky-800">Inicia sesión</button></p>
          </form>
        </section>
      </div>
    </main>
  )
}
