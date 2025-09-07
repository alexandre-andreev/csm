import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateSummary(transcript: string, videoTitle: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `
Создайте краткую и информативную аннотацию для YouTube видео "${videoTitle}".

Транскрипт видео:
${transcript}

Требования к аннотации:
1. Длина: 3-5 абзацев
2. Язык: русский
3. Структура:
   - Краткое введение в тему
   - Основные моменты и ключевые идеи
   - Практические советы или выводы (если применимо)
   - Заключение

Стиль:
- Профессиональный, но доступный
- Используйте маркированные списки для ключевых пунктов
- Выделяйте важные моменты **жирным шрифтом**
- Избегайте повторений и воды

Аннотация:
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Ошибка генерации аннотации:', error)
    throw new Error('Не удалось создать аннотацию')
  }
}
