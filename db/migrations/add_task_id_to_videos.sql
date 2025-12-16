-- Add task_id column to videos table for Extend Video functionality
-- This stores the Kie.ai task ID which is needed to extend videos

ALTER TABLE videos
ADD COLUMN IF NOT EXISTS task_id TEXT;

-- Add index for faster lookups by task_id
CREATE INDEX IF NOT EXISTS idx_videos_task_id ON videos(task_id);

-- Add comment explaining the column
COMMENT ON COLUMN videos.task_id IS 'Kie.ai task ID used for video extension functionality';
