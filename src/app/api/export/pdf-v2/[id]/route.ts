import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markdownToText } from '@/lib/utils/markdown-to-text'
import { generatePDFFileName } from '@/lib/utils/filename-generator'

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

    // Конвертируем Markdown в обычный текст
    const plainText = markdownToText(summary.summary_text)
    
    // Формируем HTML для PDF
    const date = new Date(summary.created_at)
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #2c3e50;
        }
        .metadata {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .metadata div {
          margin-bottom: 5px;
        }
        .content {
          font-size: 16px;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${summary.video_title}</div>
      </div>
      
      <div class="metadata">
        <div><strong>Источник:</strong> ${summary.youtube_url}</div>
        <div><strong>Канал:</strong> ${summary.channel_title || 'Неизвестный канал'}</div>
        <div><strong>Дата создания:</strong> ${date.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</div>
        <div><strong>Время обработки:</strong> ${Math.round(summary.processing_time / 1000)}с</div>
      </div>
      
      <div class="content">
        <h2>ИИ-аннотация</h2>
        ${plainText}
      </div>
      
      <div class="footer">
        <div><strong>ID видео:</strong> ${summary.video_id}</div>
        <div><strong>Длительность:</strong> ${summary.duration || 'Неизвестно'}</div>
        <div><strong>Создано с помощью:</strong> Аннотация видео (ИИ-сервис)</div>
      </div>
    </body>
    </html>
    `

    // Динамически импортируем Puppeteer
    const puppeteer = await import('puppeteer-core')
    
    // Пробуем разные пути к Chromium
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/opt/google/chrome/chrome'
    ].filter(Boolean)
    
    let browser
    let lastError
    
    for (const executablePath of possiblePaths) {
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--font-render-hinting=none',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          executablePath
        })
        break // Если успешно запустили, выходим из цикла
      } catch (error) {
        lastError = error
        console.log(`Не удалось запустить браузер по пути: ${executablePath}`)
        continue
      }
    }
    
    if (!browser) {
      throw new Error(`Не удалось найти рабочий браузер. Последняя ошибка: ${lastError?.message}`)
    }

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: false,
      scale: 0.8
    })

    await browser.close()

    // Формируем имя файла с улучшенной генерацией
    const fileName = generatePDFFileName(summary.video_title, date)

    // Возвращаем PDF файл
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Ошибка экспорта в PDF:', error)
    
    // Более детальная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('Could not find Chrome')) {
        return NextResponse.json(
          { error: 'PDF экспорт временно недоступен. Попробуйте позже.' },
          { status: 503 }
        )
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Превышено время ожидания. Попробуйте позже.' },
          { status: 408 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
