'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Trash2, ExternalLink, Clock, Calendar, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Summary {
  id: string
  title: string
  video_url: string
  summary: string
  created_at: string
  is_favorite: boolean
  processing_time: number
}

export default function SummaryPage({ params }: { params: { id: string } }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSummary()
  }, [params.id])

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/summaries/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Ошибка загрузки аннотации:', error)
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!summary) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/summaries/${summary.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_favorite: !summary.is_favorite }),
      })

      if (response.ok) {
        setSummary(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
      }
    } catch (error) {
      console.error('Ошибка обновления избранного:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteSummary = async () => {
    if (!summary) return

    if (!confirm('Вы уверены, что хотите удалить эту аннотацию?')) return

    try {
      const response = await fetch(`/api/summaries/${summary.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Ошибка удаления аннотации:', error)
    }
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          Загрузка аннотации...
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          Аннотация не найдена
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)'
    }}>
      {/* Navigation */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'transparent',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#9333ea'
                e.currentTarget.style.color = '#9333ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.color = '#374151'
              }}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              Назад
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
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
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#111827'
              }}>
                Аннотация видео
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={toggleFavorite}
              disabled={isUpdating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: summary.is_favorite ? '#fef2f2' : 'transparent',
                color: summary.is_favorite ? '#dc2626' : '#374151',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.borderColor = '#dc2626'
                  e.currentTarget.style.color = '#dc2626'
                }
              }}
              onMouseOut={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.color = summary.is_favorite ? '#dc2626' : '#374151'
                }
              }}
            >
              <Heart style={{ 
                width: '1rem', 
                height: '1rem',
                fill: summary.is_favorite ? '#dc2626' : 'none'
              }} />
              {summary.is_favorite ? 'В избранном' : 'В избранное'}
            </button>

            <button
              onClick={deleteSummary}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'transparent',
                color: '#dc2626',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#dc2626'
                e.currentTarget.style.backgroundColor = '#fef2f2'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Trash2 style={{ width: '1rem', height: '1rem' }} />
              Удалить
            </button>
          </div>
        </div>
      </nav>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Video Info */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 1rem 0',
                lineHeight: '1.3'
              }}>
                {summary.title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Calendar style={{ width: '1rem', height: '1rem' }} />
                  <span>
                    {new Date(summary.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock style={{ width: '1rem', height: '1rem' }} />
                  <span>
                    {Math.round(summary.processing_time / 1000)}с обработки
                  </span>
                </div>
              </div>

              <a
                href={summary.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.color = '#3b82f6'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.color = '#374151'
                }}
              >
                <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                Открыть видео на YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Summary Content */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#9333ea' }} />
            ИИ-аннотация
          </h2>

          <div style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            color: '#374151'
          }}>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '1.5rem 0 1rem 0'
                  }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '1.25rem 0 0.75rem 0'
                  }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '1rem 0 0.5rem 0'
                  }}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p style={{
                    margin: '0 0 1rem 0',
                    lineHeight: '1.7'
                  }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul style={{
                    margin: '0 0 1rem 0',
                    paddingLeft: '1.5rem'
                  }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol style={{
                    margin: '0 0 1rem 0',
                    paddingLeft: '1.5rem'
                  }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li style={{
                    margin: '0.25rem 0',
                    lineHeight: '1.6'
                  }}>
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong style={{
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em style={{
                    fontStyle: 'italic',
                    color: '#6b7280'
                  }}>
                    {children}
                  </em>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: '4px solid #9333ea',
                    paddingLeft: '1rem',
                    margin: '1rem 0',
                    fontStyle: 'italic',
                    color: '#6b7280',
                    backgroundColor: '#faf5ff',
                    padding: '1rem',
                    borderRadius: '0.5rem'
                  }}>
                    {children}
                  </blockquote>
                )
              }}
            >
              {summary.summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
