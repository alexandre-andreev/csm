import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMarkdownFileName } from '@/lib/utils/filename-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // Получаем аннотацию
    const { data: summary, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !summary) {
      return NextResponse.json(
        { error: 'Аннотация не найдена' },
        { status: 404 }
      )
    }

    // Форматируем дату для имени файла
    const date = new Date(summary.created_at)
    
    // Создаем имя файла с улучшенной генерацией
    const fileName = generateMarkdownFileName(summary.video_title, date)

    // Формируем Markdown контент
    const markdownContent = `# ${summary.video_title}

> **Источник**: [YouTube видео](${summary.youtube_url})  
> **Канал**: ${summary.channel_title || 'Неизвестный канал'}  
> **Дата создания**: ${date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}  
> **Время обработки**: ${Math.round(summary.processing_time / 1000)}с

---

## ИИ-аннотация

${summary.summary_text}

---

## Метаданные

- **ID видео**: ${summary.video_id}
- **Длительность видео**: ${summary.duration || 'Неизвестно'}
- **Создано с помощью**: Аннотация видео (ИИ-сервис)
- **Теги**: #youtube #ai-annotation #summary

---

*Эта аннотация была создана автоматически с помощью ИИ на основе транскрипта YouTube видео.*`

    // Возвращаем файл с правильной кодировкой для Safari
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Transfer-Encoding': 'binary',
        'Cache-Control': 'no-cache',
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    })

  } catch (error) {
    console.error('Ошибка экспорта в Markdown:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
