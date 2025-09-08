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
    throw new Error('API ключ для получения транскрипта не настроен')
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
    throw new Error(`Ошибка получения данных от youtube-transcript.io: ${response.status}`);
  }

  try {
    const data = JSON.parse(responseText);
    console.log('Успешный сырой ответ от youtube-transcript.io:', responseText.substring(0, 500) + '...');
    return data;
  } catch (jsonError) {
    console.error('Не удалось распарсить JSON-ответ от youtube-transcript.io.');
    console.error('Сырое тело ответа:', responseText);
    throw new Error('Сервер youtube-transcript.io вернул некорректный JSON.');
  }
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  const data = await fetchTranscriptData(videoId);

  if (!Array.isArray(data) || data.length === 0 || !data[0].id) {
    console.error('Неожиданная структура API (video info):', JSON.stringify(data, null, 2));
    throw new Error('Видео не найдено или имеет неожиданный формат ответа.');
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
    throw new Error('Не удалось получить транскрипт. Возможно, у видео нет субтитров.');
  }

  const transcriptSegments = data[0].tracks[0].transcript;
  const rawText = transcriptSegments.map((segment: any) => segment.text).join(' ');
  const sanitizedText = sanitizeTextForAPI(rawText);

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
