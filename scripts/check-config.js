const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'YOUTUBE_API_KEY',
  'TRANSCRIPT_API_KEY',
]

console.log('🔍 Проверка конфигурации...\n')

let allGood = true

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: НЕ НАЙДЕН`)
    allGood = false
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('🎉 Все переменные окружения настроены правильно!')
  console.log('\n📋 Инструкции по получению API ключей:')
  console.log('1. Supabase: https://supabase.com/dashboard')
  console.log('2. Google Gemini: https://makersuite.google.com/app/apikey')
  console.log('3. YouTube Data API: https://console.developers.google.com/')
  console.log('4. YouTube Transcript: https://www.youtube-transcript.io/profile')
} else {
  console.log('⚠️  Некоторые переменные окружения не настроены!')
  console.log('\n📝 Создайте файл .env.local в корне проекта и добавьте:')
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`${varName}=your_value_here`)
    }
  })
}

console.log('\n' + '='.repeat(50))
