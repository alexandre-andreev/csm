import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript } from '@/lib/services/youtube'
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
    
    let videoId: string;
    try {
      console.log('Шаг 1: Извлечение Video ID из URL:', url);
      videoId = extractVideoId(url);
      console.log('Успешно извлечен Video ID:', videoId);
    } catch (error) {
      console.error('Ошибка на шаге 1 (extractVideoId):', error);
      return NextResponse.json({ error: 'Неверная ссылка на YouTube видео. Убедитесь, что ссылка корректна.' }, { status: 400 });
    }

    let videoInfo: Awaited<ReturnType<typeof getYouTubeVideoInfo>>;
    let transcript: string;

    try {
      console.log('Шаг 2: Получение информации о видео и транскрипта...');
      videoInfo = await getYouTubeVideoInfo(videoId);
      transcript = await getYouTubeTranscript(videoId);
      console.log('Успешно получена информация о видео:', videoInfo.title);
      console.log('Успешно получен транскрипт. Длина:', transcript.length);
    } catch (error: any) {
      console.error('Ошибка на шаге 2 (getYouTubeVideoInfo или getYouTubeTranscript):', error);
      return NextResponse.json({ error: error.message || 'Не удалось получить транскрипт или информацию о видео.' }, { status: 400 });
    }

    let summary: string;
    try {
      console.log('Шаг 3: Генерация аннотации...');
      summary = await generateSummary(transcript, videoInfo.title);
      console.log('Успешно сгенерирована аннотация. Длина:', summary.length);
    } catch (error: any) {
      console.error('Ошибка на шаге 3 (generateSummary):', error);
      return NextResponse.json({ error: error.message || 'Не удалось сгенерировать аннотацию с помощью ИИ.' }, { status: 400 });
    }
    
    const processingTime = Date.now() - startTime

    console.log('Шаг 4: Сохранение аннотации в базу данных...');
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
      console.error('Ошибка на шаге 4 (сохранение в базу данных):', insertError)
      return NextResponse.json(
        { error: 'Ошибка сохранения аннотации в базу данных' },
        { status: 500 }
      )
    }
    console.log('Успешно сохранено в базу данных. ID:', summaryData.id);

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
    console.error('Непредвиденная ошибка в summarize API:', error)
    
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
