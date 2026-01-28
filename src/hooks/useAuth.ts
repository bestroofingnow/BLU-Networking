import { useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let profile: Profile | null = null
      if (session?.user) {
        profile = await fetchProfile(session.user.id)
      }
      setState({
        user: session?.user ?? null,
        profile,
        session,
        loading: false,
        error: null,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let profile: Profile | null = null
        if (session?.user) {
          profile = await fetchProfile(session.user.id)
        }
        setState({
          user: session?.user ?? null,
          profile,
          session,
          loading: false,
          error: null,
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email: string, password: string, fullName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { error }
    }

    return { data }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { error }
    }

    return { data }
  }

  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return { error }
    }

    setState(prev => ({ ...prev, loading: false }))
    return { data }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return { error }
    }

    return { data }
  }

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { error }
    }

    return { data }
  }

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id)
      setState(prev => ({ ...prev, profile }))
    }
  }

  return {
    ...state,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.is_admin ?? false,
    isActive: state.profile?.subscription_status === 'active',
  }
}
