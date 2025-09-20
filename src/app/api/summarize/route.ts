import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript, getRelatedYouTubeVideos } from '@/lib/services/youtube'
import { generateSummary } from '@/lib/services/gemini'

function parseDurationToSeconds(duration: string): number {
  // Парсим ISO 8601 duration (например, "PT5M30S" = 5 минут 30 секунд)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL видео обязателен' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // Извлекаем ID видео
    const videoId = extractVideoId(url)

    // Получаем информацию о видео и транскрипт параллельно
    const [videoInfo, transcript] = await Promise.all([
      getYouTubeVideoInfo(videoId),
      getYouTubeTranscript(videoId)
    ])

    // Генерируем аннотацию
    let summary = await generateSummary(transcript, videoInfo.title)
    
    // Пытаемся получить до 3 похожих видео и дополняем аннотацию разделом в конце
    try {
      const related = await getRelatedYouTubeVideos(videoId, 3)
      if (Array.isArray(related) && related.length > 0) {
        const linksMd = related
          .map((r, idx) => `${idx + 1}. [${r.title}](${r.url})`)
          .join('\n')
        summary += `\n\n#### Похожие видео\n${linksMd}`
      }
    } catch (e) {
      console.warn('Не удалось получить похожие видео:', e)
    }

    const processingTime = Date.now() - startTime

    // Сохраняем аннотацию в базу данных
    const { data: summaryData, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        video_title: videoInfo.title,
        youtube_url: url,
        video_id: videoId,
        transcript_text: transcript,
        summary_text: summary,
        processing_time: processingTime,
        is_favorite: false,
        channel_title: videoInfo.channelTitle,
        video_duration: videoInfo.duration ? parseDurationToSeconds(videoInfo.duration) : 0,
        duration: videoInfo.duration,
        thumbnail_url: videoInfo.thumbnail
      })
      .select()
      .single()

    if (insertError) {
      console.error('Ошибка сохранения аннотации:', insertError)
      return NextResponse.json(
        { error: 'Ошибка сохранения аннотации' },
        { status: 500 }
      )
    }

    // Логируем статистику использования
    await supabase
      .from('usage_statistics')
      .insert({
        user_id: user.id,
        action: 'summary_created',
        metadata: {
          video_id: videoId,
          processing_time: processingTime,
          summary_length: summary.length
        }
      })

    return NextResponse.json(summaryData)
  } catch (error) {
    console.error('Ошибка создания аннотации:', error)
    
    if (error instanceof Error) {
      const message = error.message || 'Произошла ошибка'
      let status = 400
      let userMessage = message

      if (message.startsWith('NO_TRANSCRIPT')) {
        status = 422
        userMessage = 'Для данного видео недоступен транскрипт/субтитры. Создание аннотации невозможно.'
      } else if (message.startsWith('VIDEO_NOT_FOUND')) {
        status = 404
        userMessage = 'Видео не найдено. Проверьте ссылку или доступность видео.'
      } else if (message.startsWith('TRANSCRIPT_FORBIDDEN')) {
        status = 403
        userMessage = 'Доступ к транскрипту ограничен. Вероятно, видео приватное или защищено.'
      } else if (message.startsWith('CONFIG_MISSING')) {
        status = 500
        userMessage = 'Сервис временно недоступен: отсутствует конфигурация.'
      } else if (message.startsWith('TRANSCRIPT_API_ERROR')) {
        status = 502
        userMessage = 'Внешний сервис транскрипции вернул ошибку. Попробуйте позже.'
      }

      return NextResponse.json(
        { error: userMessage, code: message.split(':')[0] },
        { status }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
