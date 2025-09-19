import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'ID не найден' }, { status: 400 });
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const { data: summary, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Ошибка получения аннотации:', error)
      return NextResponse.json(
        { error: 'Аннотация не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Ошибка получения аннотации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'ID не найден' }, { status: 400 });
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления аннотации:', error)
      return NextResponse.json(
        { error: 'Ошибка удаления аннотации' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления аннотации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  try {
    const id = params?.id as string;
    if (!id) {
      return NextResponse.json({ error: 'ID не найден' }, { status: 400 });
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    let tags: unknown = body?.tags

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Ожидается массив тегов' }, { status: 400 })
    }

    // Normalize, dedupe case-insensitive, enforce limits
    const normalized = (tags as unknown[])
      .filter((t) => typeof t === 'string')
      .map((t: any) => (t as string).trim().replace(/\s+/g, ' ').slice(0, 24))
      .filter((t) => t.length > 0)

    const deduped: string[] = []
    const seen = new Set<string>()
    for (const t of normalized) {
      const key = t.toLowerCase()
      if (!seen.has(key)) { seen.add(key); deduped.push(t) }
    }

    if (deduped.length > 3) {
      return NextResponse.json({ error: 'Максимум 3 тега' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('summaries')
      .update({ tags: deduped })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Ошибка обновления тегов:', error)
      return NextResponse.json({ error: 'Ошибка обновления тегов' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Ошибка обновления тегов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}