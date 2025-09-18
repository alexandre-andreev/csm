import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markdownToText, formatTextForPDF } from '@/lib/utils/markdown-to-text'

// Динамический импорт jsPDF для серверной стороны
let jsPDF: any = null

async function getJsPDF() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf')
    jsPDF = jsPDFModule.jsPDF
  }
  return jsPDF
}

// Функция для добавления поддержки кириллицы
function addCyrillicSupport(doc: any) {
  // Добавляем базовую поддержку кириллицы
  doc.addFont('helvetica', 'normal')
  doc.setFont('helvetica', 'normal')
  
  // Функция для безопасного добавления текста с кириллицей
  const addTextSafe = (text: string, x: number, y: number) => {
    try {
      // Конвертируем текст в безопасный формат
      const safeText = text
        .replace(/[^\x00-\x7F]/g, (char) => {
          // Простая замена кириллических символов на латинские аналоги
          const cyrillicMap: { [key: string]: string } = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
            'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
            'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
            'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
            'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
          }
          return cyrillicMap[char] || char
        })
      doc.text(safeText, x, y)
    } catch (error) {
      console.error('Ошибка добавления текста:', error)
      doc.text('Ошибка отображения текста', x, y)
    }
  }
  
  return addTextSafe
}

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

    // Инициализируем jsPDF
    const PDF = await getJsPDF()
    const doc = new PDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Добавляем поддержку кириллицы
    const addTextSafe = addCyrillicSupport(doc)

    // Настройки
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let yPosition = margin

    // Функция для добавления текста с переносом
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize)
      if (isBold) {
        doc.setFont(undefined, 'bold')
      } else {
        doc.setFont(undefined, 'normal')
      }

      // Разбиваем текст на строки вручную для лучшего контроля
      const words = text.split(' ')
      const lines: string[] = []
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const textWidth = doc.getTextWidth(testLine)
        
        if (textWidth <= contentWidth) {
          currentLine = testLine
        } else {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            // Если слово длиннее ширины, добавляем его как есть
            lines.push(word)
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }

      const lineHeight = fontSize * 0.4
      
      // Проверяем, помещается ли текст на странице
      if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }

      // Добавляем каждую строку с поддержкой кириллицы
      lines.forEach(line => {
        addTextSafe(line, margin, yPosition)
        yPosition += lineHeight
      })
      
      yPosition += 5
    }

    // Заголовок
    addText(summary.video_title, 16, true)
    yPosition += 10

    // Метаданные
    const date = new Date(summary.created_at)
    const metadata = [
      `Источник: ${summary.youtube_url}`,
      `Канал: ${summary.channel_title || 'Неизвестный канал'}`,
      `Дата создания: ${date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      `Время обработки: ${Math.round(summary.processing_time / 1000)}с`
    ]

    doc.setFontSize(10)
    doc.setFont(undefined, 'italic')
    metadata.forEach(line => {
      addText(line, 10)
    })

    yPosition += 10

    // Разделитель
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    // Заголовок аннотации
    addText('ИИ-аннотация', 14, true)
    yPosition += 5

    // Конвертируем Markdown в обычный текст и форматируем
    const plainText = markdownToText(summary.summary_text)
    const formattedText = formatTextForPDF(plainText, 80)
    
    addText(formattedText, 11)

    yPosition += 20

    // Метаданные внизу
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    const footerText = [
      `ID видео: ${summary.video_id}`,
      `Длительность: ${summary.duration || 'Неизвестно'}`,
      `Создано с помощью: Аннотация видео (ИИ-сервис)`
    ]

    footerText.forEach(line => {
      addText(line, 8)
    })

    // Генерируем PDF
    const pdfBuffer = doc.output('arraybuffer')
    
    // Формируем имя файла
    const dateStr = date.toISOString().split('T')[0]
    const fileName = `${dateStr}_${summary.video_title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50)}.pdf`

    // Возвращаем PDF файл
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Ошибка экспорта в PDF:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
