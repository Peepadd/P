import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [providerToken, setProviderToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clean up any stale cached tokens from localStorage (tokens expire ~1hr)
    localStorage.removeItem('google_provider_token')

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      // Only use provider_token from a live session — never from cache
      if (session?.provider_token) {
        setProviderToken(session.provider_token)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) {
        setProviderToken(session.provider_token)
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // On sign out, clear token. On token refresh, update if provided.
        if (!session?.provider_token) {
          setProviderToken(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Call this to get a fresh provider_token from the current session
  const refreshProviderToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      setProviderToken(session.provider_token)
      return session.provider_token
    }
    return null
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/calendar',
      },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signUpWithEmail = async (email, password) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, providerToken, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProviderToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
