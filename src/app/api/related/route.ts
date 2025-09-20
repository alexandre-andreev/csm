import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractVideoId, getRelatedYouTubeVideos } from '@/lib/services/youtube'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const videoIdParam = searchParams.get('videoId')
    const title = searchParams.get('title') || undefined
    const max = Math.min(Math.max(Number(searchParams.get('max') || 3), 1), 5)

    const videoId = videoIdParam || (url ? extractVideoId(url) : '')
    if (!videoId) {
      return NextResponse.json({ error: 'Не указан videoId или url' }, { status: 400 })
    }

    const related = await getRelatedYouTubeVideos(videoId, max, title)
    return NextResponse.json({ items: related })
  } catch (e: any) {
    console.error('related error', e?.message || e)
    return NextResponse.json({ error: 'Ошибка получения похожих видео' }, { status: 500 })
  }
}


