export async function generateSummary(transcript: string, videoTitle: string): Promise<string> {
  console.log('Генерация аннотации для:', videoTitle)
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('API ключ для Gemini не настроен')
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Создай подробную аннотацию для YouTube видео "${videoTitle}" на основе следующего транскрипта. 

Требования к аннотации:
1. Используй формат Markdown
2. Включи заголовок с названием видео
3. Создай краткое описание (2-3 предложения)
4. Выдели основные темы и ключевые моменты
5. Добавь заключение
6. Пиши на русском языке
7. Будь информативным и структурированным

Транскрипт видео:
${transcript}`
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Ошибка Gemini API:', errorData)
      throw new Error(`Ошибка генерации аннотации: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Не удалось сгенерировать аннотацию')
    }

    const generatedText = data.candidates[0].content.parts[0].text
    return generatedText
  } catch (error) {
    console.error('Ошибка генерации аннотации:', error)
    throw error
  }
}
