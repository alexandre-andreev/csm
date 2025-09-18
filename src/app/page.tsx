'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Sparkles, Play, Clock, Users, Menu, X } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      width: '100%'
    }}>
      {/* Navigation */}
      <nav style={{
        padding: isMobile ? '1rem' : '1rem 2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <span style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              display: isMobile ? 'none' : 'block'
            }}>
              Аннотация видео
            </span>
          </div>
          
          {/* Desktop Menu */}
          <div style={{
            display: isMobile ? 'none' : 'flex',
            gap: '1rem'
          }}>
            <button 
              onClick={() => router.push('/login')}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
              }}
            >
              <LogIn style={{ width: '1rem', height: '1rem' }} />
              Войти
            </button>
            <button 
              onClick={() => router.push('/signup')}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <UserPlus style={{ width: '1rem', height: '1rem' }} />
              Регистрация
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div style={{
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isMobileMenuOpen ? (
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              ) : (
                <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '1rem',
            zIndex: 50
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button 
                onClick={() => {
                  router.push('/login')
                  setIsMobileMenuOpen(false)
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogIn style={{ width: '1rem', height: '1rem' }} />
                Войти
              </button>
              <button 
                onClick={() => {
                  router.push('/signup')
                  setIsMobileMenuOpen(false)
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserPlus style={{ width: '1rem', height: '1rem' }} />
                Регистрация
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: '2rem'
        }}>
          {/* Centered Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: 'fit-content'
            }}>
              <Sparkles style={{ width: '1rem', height: '1rem', color: '#ffd700' }} />
              <span style={{
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ИИ-технологии
              </span>
            </div>

            <h1 style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: '1.1',
              margin: 0,
              textAlign: 'center'
            }}>
              Создавайте аннотации<br/>
              <span style={{
                background: 'linear-gradient(45deg, #ffd700, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                YouTube видео
              </span>
            </h1>

            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.5',
              margin: 0,
              maxWidth: '600px',
              textAlign: 'center'
            }}>
              Превращайте длинные видео в краткие, информативные аннотации с помощью искусственного интеллекта. Экономьте время и получайте ключевую информацию за секунды.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.75rem' : '1rem',
              alignItems: 'center',
              width: isMobile ? '100%' : 'auto'
            }}>
              <button 
                onClick={() => router.push('/signup')}
                style={{
                  padding: isMobile ? '1rem 2rem' : '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: isMobile ? '1.1rem' : '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <Play style={{ width: '1.25rem', height: '1.25rem' }} />
                Начать бесплатно
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '1.5rem' : '2rem',
              marginTop: '1rem',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock style={{ width: '1rem', height: '1rem', color: '#ffd700' }} />
                  <span style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    &lt; 30 сек
                  </span>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}>
                  Время обработки
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Users style={{ width: '1rem', height: '1rem', color: '#4ecdc4' }} />
                  <span style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    1000+
                  </span>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem'
                }}>
                  Довольных пользователей
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}