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
2. Создай краткое описание (2-3 предложения)
3. Выдели основные темы и ключевые моменты
4. Добавь заключение
5. Пиши на русском языке
6. Будь информативным и структурированным
7. Не включай заголовок с названием видео
8. Не начинай с фразы "Аннотация к видео" или подобных
9. Не повторяй название видео в начале аннотации
10. Используй ТОЛЬКО заголовки уровня 4 (####) или меньше - НЕ используй ###, ##, #
11. Заголовки должны быть компактными и не слишком крупными

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