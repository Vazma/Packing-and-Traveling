import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const usernameToEmail = username => `${username.trim().toLowerCase()}@travel-companion.app`
const normalizeUser = sessionUser => sessionUser
  ? { ...sessionUser, username: sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] }
  : null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(normalizeUser(data.session?.user))
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(normalizeUser(session?.user))
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async (username, password) => {
    const normalizedUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      throw new Error('El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo')
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(normalizedUsername),
      password,
      options: { data: { username: normalizedUsername } }
    })
    if (error) {
      if (error.message.includes('already registered')) throw new Error('El nombre de usuario ya está en uso')
      throw error
    }
    if (!data.session) throw new Error('La cuenta fue creada, pero la confirmación de correo sigue activa en Supabase')
    return normalizeUser(data.user)
  }

  const signIn = async (username, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password
    })
    if (error) throw new Error('Usuario o contraseña incorrectos')
    return normalizeUser(data.user)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
