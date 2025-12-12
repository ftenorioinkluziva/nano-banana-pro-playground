# Video Generation API - Quick Start Guide

## API Quick Reference

### 1. Generate Video
```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cinematic shot of a sunset over mountains with golden light",
    "negativePrompt": "blurry, low quality, distorted",
    "mode": "Text to Video",
    "duration": "6s",
    "resolution": "720p",
    "aspectRatio": "16:9"
  }'
```

**Response:**
```json
{
  "videoUri": "operations/abc123xyz...",
  "prompt": "A cinematic shot of a sunset...",
  "resolution": "720p",
  "aspectRatio": "16:9",
  "duration": 6
}
```

### 2. Check Video Status (repeat every 10 seconds)
```bash
curl -X POST http://localhost:3000/api/get-video-status \
  -H "Content-Type: application/json" \
  -d '{
    "operationName": "operations/abc123xyz..."
  }'
```

**While processing:**
```json
{
  "done": false
}
```

**When complete:**
```json
{
  "done": true,
  "videoUri": "https://example.com/video.mp4"
}
```

## Parameter Details

### Prompt Requirements
- **Min**: 1 character
- **Max**: 2000 characters
- **Tip**: Be specific and descriptive for better results

### Duration (durationSeconds as number)
- `4` (4 seconds)
- `6` (6 seconds) ← Recommended default
- `8` (8 seconds) ← Only with 1080p resolution

### Resolution
- `720p` ← Recommended for speed
- `1080p` ← Only supports 8 seconds duration

### Aspect Ratio
- `"16:9"` ← Landscape (YouTube/Widescreen)
- `"9:16"` ← Portrait (TikTok/Instagram Reels)

## Generation Modes

### 1. Text to Video (Basic)
```json
{
  "mode": "Text to Video",
  "prompt": "your description here",
  "duration": "6s",
  "resolution": "720p",
  "aspectRatio": "16:9"
}
```

### 2. Frames to Video (with start/end images)
Requires FormData with:
- `startFrame`: File (image)
- `endFrame`: File (image, optional for looping)
- `isLooping`: "true" or "false"

### 3. References to Video (with style reference)
Requires FormData with:
- `referenceImages[]`: File[] (multiple images)
- `styleImage`: File (reference style)

### 4. Extend Video
Requires FormData with:
- `inputVideo`: File (MP4 video)

## Polling Strategy

### Recommended Polling
```typescript
let attempts = 0
const maxAttempts = 36 // ~6 minutes with 10s intervals

const pollInterval = setInterval(async () => {
  attempts++

  const response = await fetch('/api/get-video-status', {
    method: 'POST',
    body: JSON.stringify({ operationName })
  })

  const data = await response.json()

  if (data.done) {
    clearInterval(pollInterval)
    displayVideo(data.videoUri)
  } else if (attempts > maxAttempts) {
    clearInterval(pollInterval)
    showError('Video generation timed out')
  }
}, 10000) // Poll every 10 seconds
```

## Error Handling

### Common Issues

**"durationSeconds needs to be a number"**
- ❌ `duration: "6"` (string)
- ✅ `duration: 6` (number)

**"1080p only supports 8 seconds"**
- ❌ `resolution: "1080p", duration: "6s"`
- ✅ `resolution: "1080p", duration: "8s"`

**"Prompt is required"**
- ❌ Empty or whitespace-only prompt
- ✅ At least 1 meaningful character

**"Input video is required for Extend Video mode"**
- ❌ Forget to add inputVideo file
- ✅ Include video file in FormData

## Example: Complete Frontend Integration

```typescript
async function generateVideo(prompt: string) {
  // Step 1: Start generation
  const generateResponse = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode: 'Text to Video',
      duration: '6s',
      resolution: '720p',
      aspectRatio: '16:9'
    })
  })

  if (!generateResponse.ok) {
    const error = await generateResponse.json()
    throw new Error(error.error)
  }

  const { videoUri: operationName } = await generateResponse.json()
  console.log('Video generation started:', operationName)

  // Step 2: Poll status
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 36

    const poll = async () => {
      attempts++

      try {
        const statusResponse = await fetch('/api/get-video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        })

        const status = await statusResponse.json()

        if (status.done) {
          if (status.error) {
            reject(new Error(status.error))
          } else {
            resolve(status.videoUri)
          }
        } else if (attempts > maxAttempts) {
          reject(new Error('Video generation timed out'))
        } else {
          setTimeout(poll, 10000) // Poll again in 10 seconds
        }
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

// Usage
try {
  const videoUrl = await generateVideo('A beautiful sunset over the ocean')
  console.log('Video ready:', videoUrl)
  // Display video_url in player
} catch (error) {
  console.error('Failed to generate video:', error)
}
```

## Performance Tips

### Faster Generation
1. Use shorter durations (4s < 6s < 8s)
2. Use 720p instead of 1080p
3. Keep prompts concise but descriptive
4. Generate during off-peak hours

### Better Quality
1. Use longer durations (8s preferred)
2. Use 1080p resolution
3. Write detailed, vivid prompts
4. Use negative prompts to exclude unwanted elements

## API Limits

- **Max concurrent**: Check Google's quotas
- **Timeout**: 11 seconds minimum, 6 minutes typical max
- **Rate limit**: Depends on your API tier
- **Cost**: Check Google Generative AI pricing

## Troubleshooting

### Video not starting
- Check API key is set in `.env.local`
- Verify prompt is not empty
- Check network connection

### Status never completes
- Verify operation name is correct
- Check browser console for errors
- Try again in 30 seconds

### "Could not extract video"
- Operation may have failed
- Check the error message in response
- Review prompt for invalid content

## Next Steps

1. Integrate polling into your video generation page
2. Add progress indicators to UI
3. Save operation names to database
4. Implement cancellation for long operations
5. Add retry logic for failed requests

---

**Ready to generate videos!** 🎬
