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