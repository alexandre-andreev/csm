import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY!,
  },
  transcript: {
    apiKey: process.env.TRANSCRIPT_API_KEY!,
  },
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY',
  'YOUTUBE_API_KEY',
  'TRANSCRIPT_API_KEY',
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
}
