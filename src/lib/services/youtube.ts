interface YouTubeVideoInfo {
  title: string
  description: string
  duration: string
  thumbnail: string
  channelTitle: string
}

interface TranscriptResponse {
  text: string
  duration: number
  offset: number
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  // Временная заглушка для тестирования
  console.log('Получение информации о видео:', videoId)
  
  // Возвращаем тестовые данные
  return {
    title: `Тестовое видео ${videoId}`,
    description: 'Это тестовое описание видео для демонстрации функциональности приложения.',
    duration: 'PT5M30S',
    thumbnail: 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg',
    channelTitle: 'Тестовый канал'
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  // Временная заглушка для тестирования
  console.log('Получение транскрипта для видео:', videoId)
  
  // Возвращаем тестовый транскрипт
  return `Это тестовый транскрипт для видео ${videoId}. 
  
  В этом видео мы обсуждаем важные темы, связанные с разработкой веб-приложений. 
  
  Основные моменты:
  1. Использование современных технологий
  2. Лучшие практики разработки
  3. Оптимизация производительности
  4. Безопасность приложений
  
  Этот транскрипт создан для демонстрации функциональности приложения аннотации видео.`
}

export function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  
  if (!match) {
    throw new Error('Неверная ссылка на YouTube видео')
  }
  
  return match[1]
}
