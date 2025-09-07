export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Summary {
  id: string
  user_id: string
  title: string
  video_url: string
  summary: string
  created_at: string
  updated_at: string
  is_favorite: boolean
  processing_time: number
}

export interface UsageStatistic {
  id: string
  user_id: string
  action: string
  metadata: Record<string, any>
  created_at: string
}
