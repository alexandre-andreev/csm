interface YouTubeVideoInfo {
  title: string
  description: string
  duration: string
  thumbnail: string
  channelTitle: string
}

function sanitizeTextForAPI(text: string): string {
    try {
        const normalized = text.normalize('NFC');
        const cleaned = normalized
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') 
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ')
            .replace(/[\uFEFF\uFFFE\uFFFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return cleaned;
    } catch (error) {
        console.error('Error in sanitizeTextForAPI:', error);
        return text.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

async function fetchTranscriptData(videoId: string): Promise<any> {
  const apiKey = process.env.TRANSCRIPT_API_KEY
  if (!apiKey) {
    throw new Error('CONFIG_MISSING: API ключ для получения транскрипта не настроен')
  }

  const response = await fetch('https://www.youtube-transcript.io/api/transcripts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ ids: [videoId] })
  })
  
  const responseText = await response.text();
  if (!response.ok) {
    console.error(`Ошибка от youtube-transcript.io. Status: ${response.status}. Body: ${responseText}`);
    if (response.status === 404) {
      throw new Error('VIDEO_NOT_FOUND: Видео не найдено или удалено.')
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('TRANSCRIPT_FORBIDDEN: Доступ к транскрипту ограничен.')
    }
    throw new Error(`TRANSCRIPT_API_ERROR: Ошибка получения данных от youtube-transcript.io: ${response.status}`)
  }

  try {
    const data = JSON.parse(responseText);
    console.log('Успешный сырой ответ от youtube-transcript.io:', responseText.substring(0, 500) + '...');
    return data;
  } catch (jsonError) {
    console.error('Не удалось распарсить JSON-ответ от youtube-transcript.io.');
    console.error('Сырое тело ответа:', responseText);
    throw new Error('TRANSCRIPT_API_ERROR: Сервер youtube-transcript.io вернул некорректный JSON.');
  }
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  const data = await fetchTranscriptData(videoId);

  if (!Array.isArray(data) || data.length === 0 || !data[0].id) {
    console.error('Неожиданная структура API (video info):', JSON.stringify(data, null, 2));
    throw new Error('VIDEO_NOT_FOUND: Видео не найдено или имеет неожиданный формат ответа.');
  }
  
  const videoData = data[0];

  return {
    title: videoData.title || `Видео ${videoId}`,
    description: videoData.description || '',
    duration: videoData.duration || 'PT0S',
    thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    channelTitle: videoData.channelTitle || 'Неизвестный канал'
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  const data = await fetchTranscriptData(videoId);
  
  if (!Array.isArray(data) || data.length === 0 || !data[0].tracks || !Array.isArray(data[0].tracks) || data[0].tracks.length === 0 || !data[0].tracks[0].transcript) {
    console.error('Неожиданная структура API (transcript):', JSON.stringify(data, null, 2));
    throw new Error('NO_TRANSCRIPT: У видео нет доступного транскрипта или субтитров.');
  }

  const transcriptSegments = data[0].tracks[0].transcript;
  const rawText = transcriptSegments.map((segment: any) => segment.text).join(' ');
  const sanitizedText = sanitizeTextForAPI(rawText);

  if (!sanitizedText || sanitizedText.trim().length === 0) {
    throw new Error('NO_TRANSCRIPT: У видео нет доступного транскрипта или субтитров.')
  }

  return sanitizedText;
}

export function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  
  if (!match) {
    throw new Error('Неверная ссылка на YouTube видео')
  }
  
  return match[1]
}

/**
 * Возвращает до maxResults похожих видео для указанного videoId с помощью YouTube Data API.
 * Требуется переменная окружения YOUTUBE_DATA_API_KEY. В случае ошибок возвращает пустой список.
 */
export async function getRelatedYouTubeVideos(
  videoId: string,
  maxResults: number = 3,
  fallbackQuery?: string
): Promise<Array<{ title: string; url: string }>> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) {
    // Тихо выходим, если ключ не настроен
    return []
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      relatedToVideoId: videoId,
      maxResults: String(Math.min(Math.max(maxResults, 1), 5)),
      key: apiKey,
    })

    let res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`)
    let ok = res.ok
    let bodyText = ''
    if (!ok) {
      bodyText = await res.text().catch(() => '')
      console.error('YouTube Search API error:', res.status, bodyText)
    }

    // Fallback: if related search failed or yielded nothing, try text query by title
    let items: any[] = []
    if (ok) {
      const data = await res.json().catch(() => ({}))
      items = Array.isArray(data?.items) ? data.items : []
    }

    if ((!ok || items.length === 0) && fallbackQuery) {
      const q = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        q: fallbackQuery,
        maxResults: String(Math.min(Math.max(maxResults, 1), 5)),
        key: apiKey,
      })
      const res2 = await fetch(`https://www.googleapis.com/youtube/v3/search?${q.toString()}`)
      if (!res2.ok) {
        console.error('YouTube Search API fallback error:', res2.status, await res2.text().catch(() => ''))
        return []
      }
      const data2 = await res2.json().catch(() => ({}))
      items = Array.isArray(data2?.items) ? data2.items : []
    }

    const results: Array<{ title: string; url: string }>> = []
    for (const item of items) {
      const vid = item?.id?.videoId
      const title = item?.snippet?.title || 'Видео'
      if (vid && vid !== videoId) {
        results.push({ title, url: `https://www.youtube.com/watch?v=${vid}` })
      }
      if (results.length >= maxResults) break
    }
    return results
  } catch (e) {
    console.error('Failed to fetch related videos:', e)
    return []
  }
}