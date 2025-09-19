'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, ExternalLink, Clock, Calendar, Sparkles, Download, FileText, Menu, X, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

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

export default function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [id, setId] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // mobile context menu removed; use dedicated buttons instead
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { theme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (id) {
      fetchSummary()
    }
  }, [id])

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/summaries/${id}`)
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

  const deleteSummary = async () => {
    if (!summary) return

    // showing confirm modal instead of confirm() handled below

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

  const exportToMarkdown = async () => {
    if (!summary) return

    try {
      const response = await fetch(`/api/export/markdown/${summary.id}`)
      
      if (response.ok) {
        // Получаем имя файла из заголовка Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition')
        let fileName = `annotation_${summary.id}.md`
        
        if (contentDisposition) {
          // Пробуем извлечь имя файла из разных форматов
          let extractedFileName = null
          
          // Сначала пробуем UTF-8 формат
          const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/)
          if (utf8Match) {
            try {
              extractedFileName = decodeURIComponent(utf8Match[1])
            } catch (e) {
              console.log('Не удалось декодировать UTF-8 имя файла')
            }
          }
          
          // Если UTF-8 не сработал, пробуем обычный формат
          if (!extractedFileName) {
            const normalMatch = contentDisposition.match(/filename="([^"]+)"/)
            if (normalMatch) {
              extractedFileName = normalMatch[1]
            }
          }
          
          // Если и это не сработало, пробуем без кавычек
          if (!extractedFileName) {
            const noQuotesMatch = contentDisposition.match(/filename=([^;]+)/)
            if (noQuotesMatch) {
              extractedFileName = noQuotesMatch[1].trim()
            }
          }
          
          if (extractedFileName) {
            fileName = extractedFileName
          }
        }

        // Создаем blob и скачиваем файл
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Ошибка экспорта в Markdown')
      }
    } catch (error) {
      console.error('Ошибка экспорта в Markdown:', error)
    }
  }

  const copySummaryToClipboard = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary.summary_text)
      alert('Аннотация скопирована в буфер обмена')
    } catch (e) {
      console.error('Clipboard error:', e)
      alert('Не удалось скопировать аннотацию')
    }
  }


  if (!mounted) {
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
          Загрузка...
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: theme === 'dark' ? '#94a3b8' : '#6b7280'
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
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: theme === 'dark' ? '#94a3b8' : '#6b7280'
        }}>
          Аннотация не найдена
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #e0f2fe 100%)'
    }}>
      {/* Navigation */}
      <nav style={{
        background: theme === 'dark' 
          ? 'rgba(30, 41, 59, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: theme === 'dark' 
          ? '1px solid rgba(71, 85, 105, 0.3)' 
          : '1px solid rgba(255, 255, 255, 0.2)',
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
                border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#f1f5f9' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#9333ea'
                e.currentTarget.style.color = '#9333ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'
                e.currentTarget.style.color = theme === 'dark' ? '#f1f5f9' : '#374151'
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
              {isMobile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginLeft: '0.5rem'
                }}>
                  <ThemeToggle />
                  <button
                    onClick={exportToMarkdown}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #3b82f6',
                      backgroundColor: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Экспорт в Markdown"
                  >
                    <FileText style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button
                  onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Удалить аннотацию"
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  <button
                    onClick={copySummaryToClipboard}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                      backgroundColor: 'transparent',
                      color: theme === 'dark' ? '#f1f5f9' : '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Копировать аннотацию"
                  >
                    <Copy style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              )}
              <span style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: 'bold',
                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                display: isMobile ? 'none' : 'block'
              }}>
                Аннотация видео
              </span>
            </div>
          </div>

          <div style={{
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ThemeToggle />
            <button
              onClick={exportToMarkdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #3b82f6',
                backgroundColor: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
                color: '#3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#2563eb'
                e.currentTarget.style.backgroundColor = '#dbeafe'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.backgroundColor = '#eff6ff'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <FileText style={{ width: '1rem', height: '1rem' }} />
              Экспорт MD
            </button>
            
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
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
            <button
              onClick={copySummaryToClipboard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#f1f5f9' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Copy style={{ width: '1rem', height: '1rem' }} />
              Копировать
            </button>
          </div>
          </div>

        </nav>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Удалить аннотацию?</h3>
              <p style={{ margin: '0.75rem 0 1.25rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Это действие нельзя отменить. Аннотация будет удалена навсегда.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: theme === 'dark' ? '1px solid #374151' : '1px solid #d1d5db',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    await deleteSummary()
                    router.push('/dashboard')
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #dc2626',
                    background: '#dc2626',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Video Info */}
        <div style={{
          background: theme === 'dark' ? '#1e293b' : 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: theme === 'dark' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: theme === 'dark' 
            ? '1px solid #475569' 
            : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                margin: '0 0 1rem 0',
                lineHeight: '1.3'
              }}>
                {summary.video_title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                color: theme === 'dark' ? '#94a3b8' : '#6b7280'
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
                href={summary.youtube_url}
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
          background: theme === 'dark' ? '#1e293b' : 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: theme === 'dark' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: theme === 'dark' 
            ? '1px solid #475569' 
            : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1rem', // Reduced from 1.25rem to 1rem (2 sizes smaller)
            fontWeight: 'bold',
            color: theme === 'dark' ? '#f1f5f9' : '#111827',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#9333ea' }} />
            ИИ-аннотация
          </h2>

          <div className="prose prose-lg max-w-none" style={{
            color: theme === 'dark' ? '#cbd5e1' : 'inherit'
          }}>
            <ReactMarkdown>
              {summary.summary_text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}