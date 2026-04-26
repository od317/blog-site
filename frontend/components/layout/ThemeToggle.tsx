// components/ThemeToggle.tsx
'use client'

import { useThemeStore } from '@/lib/store/themeStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState } from 'react'

const themes = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]
  const Icon = currentTheme.icon

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-muted-foreground hover:text-primary-400 hover:bg-primary-500/10 transition-all"
        aria-label="Toggle theme"
      >
        <Icon className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-36 z-50 rounded-lg border border-primary-500/20 bg-card shadow-[0_0_20px_rgba(6,182,212,0.1)] overflow-hidden"
            >
              {themes.map(({ value, icon: ThemeIcon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all
                    ${
                      theme === value
                        ? 'bg-primary-500/10 text-primary-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                        : 'text-muted-foreground hover:bg-primary-500/5 hover:text-primary-400'
                    }`}
                >
                  <ThemeIcon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}