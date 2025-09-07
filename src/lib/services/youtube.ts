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
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.YOUTUBE_API_KEY}`
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
    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    channelTitle: video.snippet.channelTitle
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube-transcript.io/api/transcript?video_id=${videoId}`, {
      headers: {
        'X-API-Key': process.env.TRANSCRIPT_API_KEY!,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Ошибка получения транскрипта: ${response.status}`)
    }

    const data: TranscriptResponse[] = await response.json()
    
    if (!data || data.length === 0) {
      throw new Error('Транскрипт не найден для этого видео')
    }

    // Объединяем все части транскрипта в один текст
    const fullTranscript = data
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return fullTranscript
  } catch (error) {
    console.error('Ошибка получения транскрипта:', error)
    throw new Error('Не удалось получить транскрипт видео')
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
