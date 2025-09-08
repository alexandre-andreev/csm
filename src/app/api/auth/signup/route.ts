import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Имя, email и пароль обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Регистрируем пользователя
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name, // Передаем имя в метаданные
        },
      },
    })

    if (error) {
      console.error('Supabase signup error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (data.user) {
      // Запись пользователя создается автоматически триггером в базе данных,
      // поэтому этот блок кода на стороне сервера больше не нужен.
      // Он вызывал конфликт с триггером.
      // 
      // // Создаем запись пользователя в таблице users
      // const { error: insertError } = await supabase
      //   .from('users')
      //   .insert({
      //     id: data.user.id,
      //     email: data.user.email!,
      //     name: name,
      //   })

      // if (insertError) {
      //   console.error('Ошибка создания пользователя:', insertError)
      //   // Пользователь уже зарегистрирован в auth, но не в users
      //   // Это не критическая ошибка
      // }
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
