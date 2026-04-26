// stores/themeStore.ts
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

// Helper to get system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Helper to set cookie
function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Helper to get cookie
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',
  
  setTheme: (theme: Theme) => {
    const resolved = resolveTheme(theme)
    set({ theme, resolvedTheme: resolved })
    applyTheme(resolved)
    setCookie('theme', theme)
  },
}))

// Initialize theme on client side
if (typeof window !== 'undefined') {
  const savedTheme = (getCookie('theme') as Theme) || 'system'
  const resolved = resolveTheme(savedTheme)
  
  // Set initial state
  useThemeStore.setState({ 
    theme: savedTheme, 
    resolvedTheme: resolved 
  })
  
  // Don't re-apply class if it's already set (prevents flicker)
  if (!document.documentElement.classList.contains(resolved)) {
    applyTheme(resolved)
  }
  
  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      const state = useThemeStore.getState()
      if (state.theme === 'system') {
        const newResolved = getSystemTheme()
        useThemeStore.setState({ resolvedTheme: newResolved })
        applyTheme(newResolved)
      }
    })
  }
}