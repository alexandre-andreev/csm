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

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`Ошибка от youtube-transcript.io (video info). Status: ${response.status}. Body: ${responseText}`);
      throw new Error(`Ошибка получения информации о видео: ${response.status}`);
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (jsonError) {
        console.error('Не удалось распарсить JSON-ответ от youtube-transcript.io (video info).');
        console.error('Сырое тело ответа:', responseText);
        throw new Error('Сервер youtube-transcript.io вернул некорректный JSON.');
    }

    console.log('Успешный сырой ответ от youtube-transcript.io (video info):', responseText);

    if (!data || !data.transcripts || data.transcripts.length === 0) {
      console.error('В успешном ответе от youtube-transcript.io отсутствует массив `transcripts`.');
      throw new Error('Видео не найдено')
    }
    
    const transcript = data.transcripts[0]
    if (!transcript) {
      console.error('Не найден объект транскрипта в успешном ответе от youtube-transcript.io');
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

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`Ошибка от youtube-transcript.io (transcript). Status: ${response.status}. Body: ${responseText}`);
      if (response.status === 404) {
        throw new Error('Транскрипт недоступен для этого видео')
      }
      throw new Error(`Ошибка получения транскрипта: ${response.status} - ${responseText}`)
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (jsonError) {
        console.error('Не удалось распарсить JSON-ответ от youtube-transcript.io (transcript).');
        console.error('Сырое тело ответа:', responseText);
        throw new Error('Сервер youtube-transcript.io вернул некорректный JSON.');
    }

    console.log('Успешный сырой ответ от youtube-transcript.io (transcript):', responseText);
    
    if (!data || !data.transcripts || data.transcripts.length === 0) {
      console.log('Транскрипт не найден в ответе:', data)
      throw new Error('Транскрипт не найден для этого видео')
    }

    // API возвращает массив транскриптов, берем первый
    const transcript = data.transcripts[0]
    console.log('Первый транскрипт:', JSON.stringify(transcript, null, 2))
    
    if (!transcript || !transcript.transcript) {
      console.error('В ответе от youtube-transcript.io отсутствует поле "transcript"');
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
