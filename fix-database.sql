-- Проверяем существующие колонки в таблице summaries
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'summaries' 
AND table_schema = 'public';

-- Добавляем недостающие колонки, если их нет
ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS video_id TEXT;

ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS channel_title TEXT;

ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS duration TEXT;

ALTER TABLE summaries 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Проверяем результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'summaries' 
AND table_schema = 'public'
ORDER BY ordinal_position;
