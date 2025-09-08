# Google Gemini AI API Key - use to convert the transcript, received from youtube.transcript.io, into an annotation to be displayed on the app-page
GOOGLE_GEMINI_API_KEY

# YouTube Transcript API Key (use service https://www.youtube-transcript.io/profile) only for get transcript video)
TRANSCRIPT_API_KEY

fetch("https://www.youtube-transcript.io/api/transcripts", {
  method: "POST",
  headers: {
    "Authorization": "Basic <your-api-token>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ 
    ids: ["jNQXAC9IVRw"], 
  })
})

curl -X POST https://www.youtube-transcript.io/api/transcripts \
  -H "Authorization: Basic <your-api-token>" \
  -H "Content-Type: application/json" \
  -d '{"ids": ["jNQXAC9IVRw"]}'
  
  

# SupaBase API KEY

NEXT_PUBLIC_SUPABASE_URL=https://peztnxhvrfulzhckugns.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

