import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('Попытка входа для email:', email)

    if (!email || !password) {
      console.log('Отсутствует email или пароль')
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Ошибка Supabase при входе:', error.message)
      return NextResponse.json(
        { error: `Ошибка входа: ${error.message}` },
        { status: 401 }
      )
    }

    // Убеждаемся, что пользователь существует в таблице users
    if (data.user) {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Ошибка создания/обновления пользователя:', upsertError)
      }
    }

    console.log('Успешный вход для пользователя:', data.user?.email)
    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Ошибка входа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
