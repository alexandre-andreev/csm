'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Trash2, Eye, LogOut, Sparkles, Clock, Users, BarChart3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Summary {
  id: string
  video_title: string
  youtube_url: string
  summary_text: string
  created_at: string
  processing_time: number
  channel_title?: string
  duration?: string
  thumbnail_url?: string
}

// Function to clean up duplicate titles in the summary
function cleanSummaryText(summaryText: string, videoTitle: string): string {
  // Split the summary into lines
  let lines = summaryText.split('\n').filter(line => line.trim() !== '');
  
  // If the first line is similar to the video title, remove it
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '').trim(); // Remove markdown headers
    const cleanVideoTitle = videoTitle.trim();
    
    // Check if the first line is the same or very similar to the video title
    if (firstLine === cleanVideoTitle || 
        firstLine.startsWith(cleanVideoTitle) ||
        cleanVideoTitle.startsWith(firstLine)) {
      // Remove the first line and join the rest
      lines = lines.slice(1);
    }
  }
  
  // Also check for "Аннотация к видео" pattern and remove it if it contains the video title
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    const cleanVideoTitle = videoTitle.trim();
    
    // Check if the first line starts with "Аннотация к видео" and contains the video title
    if (firstLine.startsWith('Аннотация к видео') && firstLine.includes(cleanVideoTitle)) {
      // Remove the first line and join the rest
      lines = lines.slice(1);
    }
  }
  
  return lines.join('\n');
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [progressText, setProgressText] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSummaries()
  }, [])

  const fetchSummaries = async () => {
    try {
      const response = await fetch('/api/summaries')
      if (response.ok) {
        const data = await response.json()
        setSummaries(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки аннотаций:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSummary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return

    setIsCreating(true)
    setProgressText('Шаг 1 из 4: Извлечение ID видео...')

    try {
      setProgressText('Шаг 2 из 4: Получение транскрипта...')
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newUrl }),
      })
      
      setProgressText('Шаг 3 из 4: Генерация аннотации...')
      const result = await response.json()

      if (response.ok) {
        setProgressText('Шаг 4 из 4: Успешно! Перенаправление...')
        setSummaries(prev => [result, ...prev])
        setNewUrl('')
        setTimeout(() => {
          router.push(`/summary/${result.id}`)
          setProgressText('')
        }, 1500)
      } else {
        setProgressText(`Ошибка: ${result.error || 'Неизвестная ошибка'}`)
      }
    } catch (err: any) {
      setProgressText(`Ошибка: ${err.message || 'Произошла ошибка'}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  const filteredSummaries = summaries.filter(summary =>
    summary.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.summary_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProcessingTime = summaries.reduce((acc, s) => acc + s.processing_time, 0)

  return (
    <>
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

            <button
              onClick={handleLogout}
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
                e.currentTarget.style.borderColor = '#dc2626'
                e.currentTarget.style.color = '#dc2626'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.color = '#374151'
              }}
            >
              <LogOut style={{ width: '1rem', height: '1rem' }} />
              Выйти
            </button>
          </div>
        </nav>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <BarChart3 style={{ width: '1.25rem', height: '1.25rem', color: '#9333ea' }} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Всего аннотаций
                </span>
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#111827'
              }}>
                {summaries.length}
              </span>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Время обработки
                </span>
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#111827'
              }}>
                {Math.round(totalProcessingTime / 1000)}с
              </span>
            </div>
          </div>

          {/* Create New Summary */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0
            }}>
              <Plus style={{ width: '1.25rem', height: '1.25rem', color: '#9333ea' }} />
              Создать новую аннотацию
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0.5rem 0 0 0'
            }}>
              Введите ссылку на YouTube для создания ИИ-аннотации
            </p>

            <form onSubmit={handleCreateSummary} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  style={{
                    flex: 1,
                    height: '3rem',
                    padding: '0 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#111827',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    height: '3rem',
                    padding: '0 2rem',
                    borderRadius: '0.5rem',
                    background: isCreating ? '#9ca3af' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
                    color: 'white',
                    border: 'none',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease-in-out',
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(147, 51, 234, 0.4)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(147, 51, 234, 0.3)'
                    }
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
              {progressText && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: progressText.startsWith('Ошибка') ? '#fef2f2' : '#f0fdf4',
                  color: progressText.startsWith('Ошибка') ? '#dc2626' : '#166534',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  {progressText}
                </div>
              )}
            </form>
          </div>

          {/* Summaries List */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827'
              }}>
                Ваши аннотации
              </h2>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  position: 'relative'
                }}>
                  <Search style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#9ca3af'
                  }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск аннотаций..."
                    style={{
                      width: '250px',
                      height: '2.5rem',
                      padding: '0 1rem 0 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#111827',
                      transition: 'border-color 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                Загрузка аннотаций...
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                {searchTerm ? 'Аннотации не найдены' : 'Пока нет аннотаций'}
                <br />
                <span style={{ fontSize: '0.875rem' }}>
                  {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую аннотацию выше'}
                </span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {filteredSummaries.map((summary) => (
                  <div
                    key={summary.id}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease-in-out',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#9333ea'
                      e.currentTarget.style.backgroundColor = '#faf5ff'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '1rem', // Reduced from 1.125rem to 1rem (2 sizes smaller)
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0 0 0.5rem 0',
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}>
                          {summary.video_title}
                        </h3>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 1rem 0',
                          lineHeight: '1.5',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
                            {cleanSummaryText(summary.summary_text, summary.video_title)}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        marginTop: 'auto'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          <span>
                            {new Date(summary.created_at).toLocaleDateString('ru-RU')}
                          </span>
                          <span>
                            {Math.round(summary.processing_time / 1000)}с
                          </span>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/summary/${summary.id}`)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            flexShrink: 0
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
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
