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
  console.log('Получение информации о видео:', videoId)
  
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('API ключ для YouTube не настроен')
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`
  )

  if (!response.ok) {
    throw new Error('Не удалось получить информацию о видео')
  }

  const data = await response.json()
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Видео не найдено')
  }

  const video = data.items[0]
  return {
    title: video.snippet.title,
    description: video.snippet.description,
    duration: video.contentDetails.duration,
    thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url,
    channelTitle: video.snippet.channelTitle
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  console.log('Получение транскрипта для видео:', videoId)
  
  const apiKey = process.env.TRANSCRIPT_API_KEY
  if (!apiKey) {
    throw new Error('API ключ для получения транскрипта не настроен')
  }

  try {
    const response = await fetch(`https://www.youtube-transcript.io/api/transcript?video_id=${videoId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'youtube-transcript.io'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Транскрипт недоступен для этого видео')
      }
      throw new Error(`Ошибка получения транскрипта: ${response.status}`)
    }

    const data: TranscriptResponse[] = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('Транскрипт не найден для этого видео')
    }

    return data.map(item => item.text).join(' ')
  } catch (error) {
    console.error('Ошибка получения транскрипта:', error)
    throw error // Пробрасываем ошибку дальше, не возвращаем заглушку
  }
}

export function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  
  if (!match) {
    throw new Error('Неверная ссылка на YouTube видео')
  }
  
  return match[1]
}
