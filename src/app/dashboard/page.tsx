'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Trash2, Eye, LogOut, Sparkles, Clock, Users, BarChart3, Download, FileText, Menu, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { markdownToText } from '@/lib/utils/markdown-to-text'
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
  tags?: string[]
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
  const PAGE_SIZE = 4
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [allowLoadMore, setAllowLoadMore] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  
  const formatISODuration = (value?: string): string => {
    if (!value) return ''
    // Try ISO 8601 PT#H#M#S
    const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (m) {
      const h = parseInt(m[1] || '0', 10)
      const mm = parseInt(m[2] || '0', 10)
      const ss = parseInt(m[3] || '0', 10)
      const parts: string[] = []
      if (h > 0) parts.push(String(h))
      parts.push(String(mm).padStart(2, '0'))
      parts.push(String(ss).padStart(2, '0'))
      return parts.join(':')
    }
    // If numeric seconds
    const secs = Number(value)
    if (!Number.isNaN(secs) && secs > 0) {
      const h = Math.floor(secs / 3600)
      const mm = Math.floor((secs % 3600) / 60)
      const ss = Math.floor(secs % 60)
      const parts: string[] = []
      if (h > 0) parts.push(String(h))
      parts.push(String(mm).padStart(2, '0'))
      parts.push(String(ss).padStart(2, '0'))
      return parts.join(':')
    }
    return value
  }

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text
    try {
      const regex = new RegExp(escapeRegExp(term), 'gi')
      const parts = text.split(regex)
      const matches = text.match(regex)
      if (!matches) return text
      const result: React.ReactNode[] = []
      for (let i = 0; i < parts.length; i++) {
        result.push(parts[i])
        if (i < matches.length) {
          result.push(
            <mark key={`m-${i}`} style={{ backgroundColor: theme === 'dark' ? '#4c1d95' : '#fef08a', color: 'inherit', padding: '0 2px', borderRadius: '2px' }}>
              {matches[i]}
            </mark>
          )
        }
      }
      return result
    } catch {
      return text
    }
  }

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
        if (result && result.error) {
          alert(result.error)
        } else {
          alert('Не удалось создать аннотацию')
        }
        setShowProgressBar(false)
      }
    } catch (err: any) {
      const message = err?.message || 'Произошла ошибка'
      setProgressText(`Ошибка: ${message}`)
      alert(message)
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
        
        console.log('Content-Disposition header:', contentDisposition)
        
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
            console.log('Extracted filename:', fileName)
          } else {
            console.log('Could not extract filename from header')
          }
        }
        
        console.log('Final filename:', fileName)

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

  const allTags: string[] = Array.from(new Set(
    summaries.flatMap(s => Array.isArray(s.tags) ? s.tags : [])
      .map(t => t || '')
      .filter(Boolean)
  ))

  const filteredAllTags = allTags.filter(t => t.toLowerCase().includes(tagSearchQuery.toLowerCase()))

  const filteredSummaries = summaries.filter(summary => {
    const matchesText = summary.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.summary_text.toLowerCase().includes(searchTerm.toLowerCase())
    const tags = Array.isArray(summary.tags) ? summary.tags : []
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => tags.map(x => x.toLowerCase()).includes(t.toLowerCase()))
    return matchesText && matchesTags
  })
  const visibleSummaries = filteredSummaries.slice(0, page * PAGE_SIZE)
  const hasMore = visibleSummaries.length < filteredSummaries.length

  useEffect(() => {
    // Reset pagination when search term changes or summaries list updates
    setPage(1)
    setAllowLoadMore(false)
  }, [searchTerm, summaries.length])

  // Автодогрузка будет включена после первого нажатия "Показать ещё"

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && allowLoadMore) {
        setIsLoadingMore(true)
        setPage((prev) => prev + 1)
      }
    }, { threshold: 0.1, rootMargin: '200px 0px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleSummaries.length, filteredSummaries.length, hasMore, allowLoadMore])

  useEffect(() => {
    // скрываем индикатор после подгрузки порции
    if (isLoadingMore) {
      const t = setTimeout(() => setIsLoadingMore(false), 150)
      return () => clearTimeout(t)
    }
  }, [visibleSummaries.length])

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
      {/* Tags Modal (mobile) */}
      {isTagModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            color: theme === 'dark' ? '#e5e7eb' : '#111827',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '520px',
            padding: '1rem',
            border: theme === 'dark' ? '1px solid #475569' : '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>Фильтр по тегам</div>
              <button onClick={() => setIsTagModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme === 'dark' ? '#94a3b8' : '#6b7280' }}>✕</button>
            </div>
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="Поиск по тегам"
              style={{
                width: '100%',
                height: '2.5rem',
                padding: '0 0.75rem',
                borderRadius: '0.5rem',
                border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? '#f1f5f9' : '#111827',
              outline: 'none',
              marginBottom: '0.75rem',
              fontSize: '16px'
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
              {filteredAllTags.map(tag => {
                const active = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => {
                        const has = prev.some(t => t.toLowerCase() === tag.toLowerCase())
                        return has ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase()) : [...prev, tag]
                      })
                    }}
                    style={{
                      padding: '0.35rem 0.7rem',
                      borderRadius: '9999px',
                      border: active ? '1px solid #9333ea' : (theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db'),
                      background: active ? 'linear-gradient(135deg, #9333ea, #3b82f6)' : (theme === 'dark' ? '#0f172a' : '#f3f4f6'),
                      color: active ? '#fff' : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    title={active ? 'Снять фильтр' : 'Фильтровать по тегу'}
                  >
                    {tag}
                  </button>
                )
              })}
              {filteredAllTags.length === 0 && (
                <div style={{ color: theme === 'dark' ? '#94a3b8' : '#6b7280', fontSize: '0.875rem' }}>Ничего не найдено</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => setSelectedTags([])} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db', background: 'transparent', cursor: 'pointer' }}>Сбросить</button>
              <button onClick={() => { setIsTagModalOpen(false); setPage(1); setAllowLoadMore(false); }} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #9333ea', background: 'linear-gradient(135deg, #9333ea, #3b82f6)', color: '#fff', cursor: 'pointer' }}>Применить</button>
            </div>
          </div>
        </div>
      )}
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
                    height: isMobile ? '3.5rem' : '3.25rem',
                    padding: isMobile ? '0 1.25rem' : '0 1.125rem',
                    borderRadius: '0.5rem',
                    border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                    backgroundColor: theme === 'dark' ? '#334155' : 'white',
                    color: theme === 'dark' ? '#f1f5f9' : '#111827',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                    fontSize: isMobile ? '1rem' : '0.975rem'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'}
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    height: isMobile ? '3.5rem' : '3.25rem',
                    padding: '0 2rem',
                    borderRadius: '0.5rem',
                    background: isCreating ? '#9ca3af' : 'linear-gradient(135deg, #9333ea, #3b82f6)',
                    color: 'white',
                    border: 'none',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '1.05rem' : '1rem',
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
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1rem'
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
                alignItems: 'stretch',
                gap: '0.75rem',
                width: '100%'
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
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
                      width: '100%',
                      maxWidth: '100%',
                      height: '2.5rem',
                      padding: '0 1rem 0 2.5rem',
                      borderRadius: '0.5rem',
                      border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                      backgroundColor: theme === 'dark' ? '#334155' : 'white',
                      color: theme === 'dark' ? '#f1f5f9' : '#111827',
                      transition: 'border-color 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme === 'dark' ? '#475569' : '#d1d5db'}
                  />
                </div>

                {/* Tags filter control */}
                {allTags.length > 0 && (
                  <div style={{ flexShrink: 0 }}>
                    {isMobile ? (
                      <button
                        onClick={() => setIsTagModalOpen(true)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                          background: 'transparent',
                          color: theme === 'dark' ? '#f1f5f9' : '#374151',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                        title="Фильтр по тегам"
                      >
                        Теги ({selectedTags.length})
                      </button>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        maxWidth: '100%'
                      }}>
                        {allTags.map(tag => {
                          const active = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                setPage(1)
                                setAllowLoadMore(false)
                                setSelectedTags(prev => {
                                  const has = prev.some(t => t.toLowerCase() === tag.toLowerCase())
                                  return has ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase()) : [...prev, tag]
                                })
                              }}
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '9999px',
                                border: active ? '1px solid #9333ea' : (theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db'),
                                background: active ? 'linear-gradient(135deg, #9333ea, #3b82f6)' : (theme === 'dark' ? '#0f172a' : '#f3f4f6'),
                                color: active ? '#fff' : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                              title={active ? 'Снять фильтр' : 'Фильтровать по тегу'}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
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
                {visibleSummaries.map((summary) => (
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
                        {(summary.thumbnail_url || summary.duration) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem'
                          }}>
                            {summary.thumbnail_url && (
                              <div
                                onClick={() => router.push(`/summary/${summary.id}`)}
                                style={{
                                  position: 'relative',
                                  width: isMobile ? '120px' : '160px',
                                  aspectRatio: '16 / 9',
                                  borderRadius: '0.5rem',
                                  overflow: 'hidden',
                                  background: theme === 'dark' ? '#1f2937' : '#e5e7eb',
                                  flexShrink: 0,
                                  cursor: 'pointer'
                                }}
                              >
                                <img
                                  src={summary.thumbnail_url}
                                  alt="thumbnail"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                {/* Убрана накладка с длительностью на миниобложке */}
                              </div>
                            )}
                            {!summary.thumbnail_url && summary.duration && (
                              <span style={{
                                fontSize: '0.8rem',
                                color: theme === 'dark' ? '#cbd5e1' : '#6b7280'
                              }}>
                                Длительность: {formatISODuration(summary.duration)}
                              </span>
                            )}
                          </div>
                        )}
                        <h3 style={{
                          fontSize: '1.125rem', // Increased from 1rem to 1.125rem (1 size larger)
                          fontWeight: '600',
                          color: theme === 'dark' ? '#f1f5f9' : '#111827',
                          margin: '0 0 0.5rem 0',
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}>
                          {highlightMatch(summary.video_title, searchTerm)}
                        </h3>
                        {/* Tags (from Supabase) */}
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          flexWrap: isMobile ? 'nowrap' : 'wrap',
                          overflowX: isMobile ? 'hidden' : 'visible',
                          gap: isMobile ? '0.35rem' : '0.5rem',
                          marginBottom: '0.5rem',
                          alignItems: 'flex-start',
                          maxWidth: '100%'
                        }}>
                          {Array.isArray(summary.tags) && summary.tags.length > 0 && summary.tags.map((tag: string) => (
                            <span key={tag} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              border: theme === 'dark' ? '1px solid #475569' : '1px solid #d1d5db',
                              background: theme === 'dark' ? '#0f172a' : '#f3f4f6',
                              color: theme === 'dark' ? '#e5e7eb' : '#374151',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
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
                          {highlightMatch(
                            markdownToText(
                              cleanSummaryText(summary.summary_text, summary.video_title)
                            ),
                            searchTerm
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
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
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '0.5rem'
                        }}>
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
                {/* Loading indicator & infinite scroll sentinel */}
                {isLoadingMore && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    color: theme === 'dark' ? '#94a3b8' : '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    Загружаю ещё...
                  </div>
                )}
                {/* Fallback button to load more if auto-load is not yet enabled */}
                {hasMore && !allowLoadMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => { setPage((prev) => prev + 1); setAllowLoadMore(true) }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: theme === 'dark' ? '1px solid #f59e0b' : '1px solid #d1d5db',
                        background: theme === 'dark' ? '#fbbf24' : 'transparent',
                        color: theme === 'dark' ? '#111827' : 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      Показать ещё
                    </button>
                  </div>
                )}
                {hasMore && allowLoadMore && (
                  <div ref={sentinelRef} style={{ height: 1 }} />
                )}
                {page > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => { setPage(1); setAllowLoadMore(false); setIsLoadingMore(false) }}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: theme === 'dark' ? '1px solid #f59e0b' : '1px solid #d1d5db',
                        background: theme === 'dark' ? '#fbbf24' : 'transparent',
                        color: theme === 'dark' ? '#111827' : 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      Свернуть
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
