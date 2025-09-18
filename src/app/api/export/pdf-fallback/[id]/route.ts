import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Аннотация не найдена' },
        { status: 404 }
      )
    }

    const date = new Date().toISOString().split('T')[0]
    const fileName = generatePDFFileName(summary.video_title, date)

    // Простой текстовый PDF с помощью jspdf
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    
    // Заголовок
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Аннотация видео', 20, 30)
    
    // Название видео
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    const videoTitle = summary.video_title.length > 60 
      ? summary.video_title.substring(0, 60) + '...'
      : summary.video_title
    doc.text(videoTitle, 20, 50)
    
    // URL видео
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`URL: ${summary.youtube_url}`, 20, 65)
    
    // Дата создания
    const createdDate = new Date(summary.created_at).toLocaleDateString('ru-RU')
    doc.text(`Создано: ${createdDate}`, 20, 75)
    
    // Время обработки
    const processingTime = Math.round(summary.processing_time / 1000)
    doc.text(`Время обработки: ${processingTime}с`, 20, 85)
    
    // Аннотация
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Аннотация:', 20, 105)
    
    // Текст аннотации
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const text = summary.summary_text
    const splitText = doc.splitTextToSize(text, 170)
    doc.text(splitText, 20, 120)
    
    // Генерируем PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Ошибка fallback PDF экспорта:', error)
    return NextResponse.json(
      { error: 'Ошибка создания PDF' },
      { status: 500 }
    )
  }
}
