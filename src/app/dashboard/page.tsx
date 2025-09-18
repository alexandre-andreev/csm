'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Trash2, Eye, LogOut, Sparkles, Clock, Users, BarChart3, Download, FileText, Menu, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import ProgressBar from '@/components/ui/ProgressBar'
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
    
    // Check if the first line starts with "Аннотация к видео" (with or without colon) and contains the video title
    if ((firstLine.startsWith('Аннотация к видео') || firstLine.startsWith('Аннотация к видео:')) && firstLine.includes(cleanVideoTitle)) {
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
  const [progress, setProgress] = useState(0)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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
    setShowProgressBar(true)
    setProgress(0)
    setProgressText('Шаг 1 из 4: Извлечение ID видео...')

    try {
      // Шаг 1: Извлечение ID видео (10%)
      setProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProgressText('Шаг 2 из 4: Получение транскрипта...')
      setProgress(25)
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newUrl }),
      })
      
      setProgressText('Шаг 3 из 4: Генерация аннотации...')
      setProgress(60)
      
      const result = await response.json()

      if (response.ok) {
        setProgressText('Шаг 4 из 4: Успешно! Перенаправление...')
        setProgress(90)
        
        setSummaries(prev => [result, ...prev])
        setNewUrl('')
        
        setProgress(100)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setShowProgressBar(false)
        router.push(`/summary/${result.id}`)
      } else {
        setProgressText(`Ошибка: ${result.error || 'Неизвестная ошибка'}`)
        setShowProgressBar(false)
      }
    } catch (err: any) {
      setProgressText(`Ошибка: ${err.message || 'Произошла ошибка'}`)
      setShowProgressBar(false)
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

  const exportToMarkdown = async (summaryId: string) => {
    try {
      const response = await fetch(`/api/export/markdown/${summaryId}`)
      
      if (response.ok) {
        // Получаем имя файла из заголовка Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition')
        let fileName = `annotation_${summaryId}.md`
        
        if (contentDisposition) {
          // Пробуем разные варианты извлечения имени файла
          const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/) || 
                               contentDisposition.match(/filename="(.+)"/) ||
                               contentDisposition.match(/filename=([^;]+)/)
          
          if (filenameMatch) {
            try {
              fileName = decodeURIComponent(filenameMatch[1])
            } catch (e) {
              // Если не удалось декодировать, используем как есть
              fileName = filenameMatch[1].replace(/"/g, '')
            }
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

  const deleteSummary = async (summaryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту аннотацию?')) return

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Обновляем список аннотаций
        setSummaries(prev => prev.filter(s => s.id !== summaryId))
      } else {
        const errorData = await response.json()
        console.error('Ошибка удаления аннотации:', errorData.error)
        alert(`Ошибка удаления аннотации: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Ошибка удаления аннотации:', error)
      alert('Ошибка удаления аннотации. Попробуйте позже.')
    }
  }

  const filteredSummaries = summaries.filter(summary =>
    summary.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.summary_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProcessingTime = summaries.reduce((acc, s) => acc + s.processing_time, 0)
  const averageProcessingTime = summaries.length > 0 ? Math.round(totalProcessingTime / summaries.length / 1000) : 0

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

  return (
    <>
      <ProgressBar 
        progress={progress} 
        text={progressText} 
        isVisible={showProgressBar} 
      />
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
            {/* Logo */}
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
                color: theme === 'dark' ? '#f1f5f9' : '#111827',
                display: isMobile ? 'none' : 'block'
              }}>
                Аннотация видео
              </span>
            </div>

            {/* Desktop Menu */}
            <div style={{
              display: isMobile ? 'none' : 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ThemeToggle />
              
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? '#fbbf24' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#dc2626'
                  e.currentTarget.style.color = '#dc2626'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'
                  e.currentTarget.style.color = theme === 'dark' ? '#fbbf24' : '#374151'
                }}
              >
                <LogOut style={{ width: '1rem', height: '1rem' }} />
                Выйти
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? '#f1f5f9' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
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
              background: theme === 'dark' 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: theme === 'dark' 
                ? '1px solid rgba(71, 85, 105, 0.3)' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              zIndex: 50
            }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? '#fbbf24' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <LogOut style={{ width: '1rem', height: '1rem' }} />
                Выйти
              </button>
            </div>
          )}
        </nav>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile 
              ? '1fr' 
              : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: theme === 'dark' ? '#1e293b' : 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: theme === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: theme === 'dark' 
                ? '1px solid #475569' 
                : '1px solid rgba(255, 255, 255, 0.2)'
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
                  color: theme === 'dark' ? '#94a3b8' : '#6b7280'
                }}>
                  Всего аннотаций
                </span>
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: theme === 'dark' ? '#f1f5f9' : '#111827'
              }}>
                {summaries.length}
              </span>
            </div>

            <div style={{
              background: theme === 'dark' ? '#1e293b' : 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: theme === 'dark' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: theme === 'dark' 
                ? '1px solid #475569' 
                : '1px solid rgba(255, 255, 255, 0.2)'
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
                  color: theme === 'dark' ? '#94a3b8' : '#6b7280'
                }}>
                  Среднее время обработки
                </span>
              </div>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: theme === 'dark' ? '#f1f5f9' : '#111827'
              }}>
                {averageProcessingTime}с
              </span>
            </div>
          </div>

          {/* Create New Summary */}
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
            <h2 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              color: theme === 'dark' ? '#f1f5f9' : '#111827'
            }}>
              <Plus style={{ width: '1.25rem', height: '1.25rem', color: '#9333ea' }} />
              Создать новую аннотацию
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: theme === 'dark' ? '#94a3b8' : '#6b7280',
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
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '1rem' 
              }}>
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
                    border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                    backgroundColor: theme === 'dark' ? '#334155' : 'white',
                    color: theme === 'dark' ? '#f1f5f9' : '#111827',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'}
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
            </form>
          </div>

          {/* Summaries List */}
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
                color: theme === 'dark' ? '#f1f5f9' : '#111827'
              }}>
                Ваши аннотации
              </h2>
              
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
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
                      width: isMobile ? '100%' : '250px',
                      maxWidth: '100%',
                      height: '2.5rem',
                      padding: '0 1rem 0 2.5rem',
                      borderRadius: '0.5rem',
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
                    className="dashboard-summary"
                    style={{
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      border: theme === 'dark' ? '1px solid #475569' : '1px solid #e5e7eb',
                      backgroundColor: theme === 'dark' ? '#334155' : '#f9fafb',
                      transition: 'all 0.2s ease-in-out',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#9333ea'
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#475569' : '#faf5ff'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#e5e7eb'
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#334155' : '#f9fafb'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '1rem' : '0'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '1.125rem', // Increased from 1rem to 1.125rem (1 size larger)
                          fontWeight: '600',
                          color: theme === 'dark' ? '#f1f5f9' : '#111827',
                          margin: '0 0 0.5rem 0',
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}>
                          {summary.video_title}
                        </h3>
                        <div 
                          className="prose prose-sm max-w-none"
                          style={{
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            color: theme === 'dark' ? '#cbd5e1' : '#6b7280'
                          }}
                        >
                          <ReactMarkdown>
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
                          color: theme === 'dark' ? '#94a3b8' : '#9ca3af'
                        }}>
                          <span>
                            {new Date(summary.created_at).toLocaleDateString('ru-RU')}
                          </span>
                          <span>
                            {Math.round(summary.processing_time / 1000)}с
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'stretch' : 'center',
                          gap: isMobile ? '0.75rem' : '0.5rem'
                        }}>
                          <button
                            onClick={() => exportToMarkdown(summary.id)}
                            title="Экспортировать в Markdown"
                            style={{
                              padding: isMobile ? '0.75rem 1rem' : '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #3b82f6',
                              backgroundColor: theme === 'dark' ? '#1e3a8a' : '#eff6ff',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              fontSize: isMobile ? '0.875rem' : '0.75rem',
                              fontWeight: '500',
                              minHeight: isMobile ? '44px' : 'auto'
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
                            <FileText style={{ width: '0.875rem', height: '0.875rem' }} />
                            MD
                          </button>
                          
                          
                          <button
                            onClick={() => router.push(`/summary/${summary.id}`)}
                            title="Просмотреть полную аннотацию"
                            style={{
                              padding: isMobile ? '0.75rem 1rem' : '0.5rem',
                              borderRadius: '0.375rem',
                              border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                              backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                              color: theme === 'dark' ? '#f1f5f9' : '#374151',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              fontSize: isMobile ? '0.875rem' : '0.75rem',
                              fontWeight: '500',
                              minHeight: isMobile ? '44px' : 'auto'
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
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          
                          <button
                            onClick={() => deleteSummary(summary.id)}
                            title="Удалить аннотацию"
                            style={{
                              padding: isMobile ? '0.75rem 1rem' : '0.5rem',
                              borderRadius: '0.375rem',
                              border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                              backgroundColor: 'transparent',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              fontSize: isMobile ? '0.875rem' : '0.75rem',
                              fontWeight: '500',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#dc2626'
                              e.currentTarget.style.backgroundColor = '#fef2f2'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
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
