'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Ошибка входа')
      }
    } catch (error) {
      setError('Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          Загрузка...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: theme === 'dark' ? '#1e293b' : 'white',
        borderRadius: '1rem',
        boxShadow: theme === 'dark' 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '2rem',
        border: theme === 'dark' ? '1px solid #475569' : 'none'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0
          }}>
            <ThemeToggle />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <span style={{
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #9333ea, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Аннотация видео
            </span>
          </div>
          
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            margin: 0,
            color: theme === 'dark' ? '#f1f5f9' : '#111827'
          }}>
            Добро пожаловать
          </h1>
          <p style={{
            opacity: 0.9,
            fontSize: '1rem',
            margin: 0,
            color: theme === 'dark' ? '#94a3b8' : '#6b7280'
          }}>
            Войдите в свой аккаунт, чтобы продолжить
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {error && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
              border: theme === 'dark' ? '1px solid #991b1b' : '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label htmlFor="email" style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#f1f5f9' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Адрес электронной почты
            </label>
            <div style={{
              position: 'relative'
            }}>
              <Mail style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: '#9ca3af'
              }} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                required
                style={{
                  width: 'calc(100% - 2.5rem)',
                  height: '3rem',
                  padding: '0 1rem 0 2.5rem',
                  borderRadius: '0.375rem',
                  border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: theme === 'dark' ? '#334155' : 'white',
                  color: theme === 'dark' ? '#f1f5f9' : '#111827',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                onBlur={(e) => e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label htmlFor="password" style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme === 'dark' ? '#f1f5f9' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Пароль
            </label>
            <div style={{
              position: 'relative'
            }}>
              <Lock style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1rem',
                height: '1rem',
                color: '#9ca3af'
              }} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите ваш пароль"
                required
                style={{
                  width: 'calc(100% - 2.5rem)',
                  height: '3rem',
                  padding: '0 1rem 0 2.5rem',
                  borderRadius: '0.375rem',
                  border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: theme === 'dark' ? '#334155' : 'white',
                  color: theme === 'dark' ? '#f1f5f9' : '#111827',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                onBlur={(e) => e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: 'calc(100% - 2.5rem)',
              height: '3rem',
              borderRadius: '0.375rem',
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
              color: 'white',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease-in-out',
              transform: 'translateY(0)',
              boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.3)',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(147, 51, 234, 0.4)'
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(147, 51, 234, 0.3)'
              }
            }}
          >
            <LogIn style={{ width: '1rem', height: '1rem' }} />
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: theme === 'dark' ? '1px solid #475569' : '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: theme === 'dark' ? '#94a3b8' : '#6b7280',
            margin: 0
          }}>
            Нет аккаунта?{' '}
            <button
              onClick={() => router.push('/signup')}
              style={{
                color: '#9333ea',
                textDecoration: 'none',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Зарегистрироваться
            </button>
          </p>
          
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '1rem auto 0',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#9333ea'
              e.currentTarget.style.color = '#9333ea'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.color = '#6b7280'
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            На главную
          </button>
        </div>
      </div>
    </div>
  )
}
