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
  console.log('Получение информации о видео из youtube-transcript.io:', videoId)
  
  const apiKey = process.env.TRANSCRIPT_API_KEY
  if (!apiKey) {
    throw new Error('API ключ для получения транскрипта не настроен')
  }

  try {
    const response = await fetch('https://www.youtube-transcript.io/api/transcripts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ids: [videoId]
      })
    })

    if (!response.ok) {
      throw new Error(`Ошибка получения информации о видео: ${response.status}`)
    }

    const data = await response.json()
    console.log('Ответ от youtube-transcript.io для информации о видео:', JSON.stringify(data, null, 2))
    
    if (!data || !data.transcripts || data.transcripts.length === 0) {
      throw new Error('Видео не найдено')
    }

    const transcript = data.transcripts[0]
    if (!transcript) {
      throw new Error('Информация о видео не найдена')
    }

    // Извлекаем информацию о видео из ответа youtube-transcript.io
    return {
      title: transcript.title || `Видео ${videoId}`,
      description: transcript.description || '',
      duration: transcript.duration || 'PT0S',
      thumbnail: transcript.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: transcript.channelTitle || 'Неизвестный канал'
    }
  } catch (error) {
    console.error('Ошибка получения информации о видео:', error)
    throw error
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  console.log('Получение транскрипта для видео:', videoId)
  
  const apiKey = process.env.TRANSCRIPT_API_KEY
  if (!apiKey) {
    throw new Error('API ключ для получения транскрипта не настроен')
  }

  try {
    console.log('Отправка запроса к youtube-transcript.io с API ключом:', apiKey.substring(0, 10) + '...')
    
    const response = await fetch('https://www.youtube-transcript.io/api/transcripts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ids: [videoId]
      })
    })

    console.log('Ответ от youtube-transcript.io:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ошибка ответа от youtube-transcript.io:', errorText)
      
      if (response.status === 404) {
        throw new Error('Транскрипт недоступен для этого видео')
      }
      throw new Error(`Ошибка получения транскрипта: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Ответ от youtube-transcript.io:', JSON.stringify(data, null, 2))
    
    if (!data || !data.transcripts || data.transcripts.length === 0) {
      console.log('Транскрипт не найден в ответе:', data)
      throw new Error('Транскрипт не найден для этого видео')
    }

    // API возвращает массив транскриптов, берем первый
    const transcript = data.transcripts[0]
    console.log('Первый транскрипт:', JSON.stringify(transcript, null, 2))
    
    if (!transcript || !transcript.transcript) {
      throw new Error('Транскрипт не найден для этого видео')
    }

    return transcript.transcript.map((item: any) => item.text).join(' ')
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
