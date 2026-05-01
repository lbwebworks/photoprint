import { useState, useEffect } from 'react'

/**
 * Works like useState but reads the initial value from localStorage
 * and writes every update back to it automatically.
 */
export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // localStorage unavailable (private browsing quota, etc.) — fail silently
    }
  }, [key, state])

  return [state, setState]
}
