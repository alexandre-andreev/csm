'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '0.5rem',
        border: '1px solid #d1d5db',
        backgroundColor: 'transparent',
        color: theme === 'dark' ? '#fbbf24' : '#6b7280',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = theme === 'dark' ? '#fbbf24' : '#3b82f6'
        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#451a03' : '#eff6ff'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = '#d1d5db'
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      <div style={{
        position: 'relative',
        width: '1.25rem',
        height: '1.25rem',
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Sun 
          style={{
            position: 'absolute',
            width: '1.25rem',
            height: '1.25rem',
            opacity: theme === 'light' ? 1 : 0,
            transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0.5)',
            transition: 'all 0.3s ease-in-out',
            top: '50%',
            left: '50%',
            marginTop: '-0.625rem',
            marginLeft: '-0.625rem'
          }}
        />
        <Moon 
          style={{
            position: 'absolute',
            width: '1.25rem',
            height: '1.25rem',
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.5)',
            transition: 'all 0.3s ease-in-out',
            top: '50%',
            left: '50%',
            marginTop: '-0.625rem',
            marginLeft: '-0.625rem'
          }}
        />
      </div>
    </button>
  )
}
