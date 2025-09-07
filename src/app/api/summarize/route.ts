import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript } from '@/lib/services/youtube'
import { generateSummary } from '@/lib/services/gemini'

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
    const summary = await generateSummary(transcript, videoInfo.title)

    const processingTime = Date.now() - startTime

    // Сохраняем аннотацию в базу данных
    const { data: summaryData, error: insertError } = await supabase
      .from('summaries')
      .insert({
        user_id: user.id,
        title: videoInfo.title,
        video_url: url,
        summary: summary,
        processing_time: processingTime,
        is_favorite: false
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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
