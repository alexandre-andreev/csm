import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const url = searchParams.get('url')

    if (!videoId && !url) {
      return NextResponse.json({ error: 'Укажите videoId или url' }, { status: 400 })
    }

    let query = supabase.from('summaries').select('id, video_id, youtube_url').eq('user_id', user.id).limit(1)
    if (videoId) query = query.eq('video_id', videoId)
    if (url) query = query.eq('youtube_url', url)

    const { data, error } = await query
    if (error) {
      console.error('exists query error', error)
      return NextResponse.json({ error: 'Ошибка проверки' }, { status: 500 })
    }

    const exists = Array.isArray(data) && data.length > 0
    return NextResponse.json({ exists, summary: exists ? data[0] : null })
  } catch (e) {
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}


