# Video Generation Fix - Complete Reimplementation

## Summary

The video generation feature has been completely reimplemented based on the functional `veo-studio` MVP. The main issue was that polling was happening on the client-side incompletely, while the API only returned an operation name without the actual video.

## Changes Made

### 1. **API Route: `/api/generate-video/route.ts`** (COMPLETELY REWRITTEN)

**Before:**
- Only initiated video generation
- Returned `operationName` immediately
- Expected client to poll `/api/get-video-status`

**After (Based on veo-studio):**
- Initiates video generation
- **Polls internally on the server** until `operation.done === true`
- Downloads the actual video file using `fetch(videoUri + '&key=' + apiKey)`
- Converts to base64 data URL
- Returns complete video ready for display

**Key Code Added:**
```typescript
// POLLING LOOP - This is the key part from veo-studio that was missing!
console.log("Starting polling loop...")
let pollCount = 0
const maxPolls = 60 // 10 minutes maximum (60 * 10s = 600s)

while (!operation.done) {
  pollCount++
  if (pollCount > maxPolls) {
    return NextResponse.json<ErrorResponse>(
      { error: "Video generation timeout", details: "Video generation took too long to complete" },
      { status: 504 }
    )
  }

  console.log(`Polling... (attempt ${pollCount}/${maxPolls})`)
  await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds
  operation = await ai.operations.getVideosOperation({ operation: operation })
}

// Extract video URL from response
const videoUri = decodeURIComponent(firstVideo.video.uri)

// Fetch the actual video file (based on veo-studio implementation)
const videoResponse = await fetch(`${videoUri}&key=${apiKey}`)
const videoBlob = await videoResponse.blob()

// Convert blob to base64 for response
const arrayBuffer = await videoBlob.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const base64Video = buffer.toString("base64")
const videoDataUrl = `data:${videoBlob.type};base64,${base64Video}`

// Return the complete video with all metadata
return NextResponse.json<GenerateVideoResponse>({
  videoUrl: videoDataUrl,
  videoUri: videoUri,
  // ... other metadata
})
```

### 2. **Hook: `use-video-generation.ts`** (SIMPLIFIED)

**Before:**
- Called `/api/generate-video` once
- Expected client-side polling (not implemented)
- Used `data.videoUri` which was just the operation name

**After:**
- Calls `/api/generate-video` once
- Waits for complete response (API handles polling internally)
- Uses `data.videoUrl` for the base64 video data
- Fixed reference images to use indexed keys (`referenceImage0`, `referenceImage1`, etc.)

**Key Changes:**
```typescript
// Fixed reference images indexing
params.referenceImages.forEach((img, index) => {
  formData.append(`referenceImage${index}`, img.file)
})

// Use the complete video from API
video_url: data.videoUrl, // Use the base64 data URL from API
video_uri: data.videoUri, // Keep the original URI for reference
```

### 3. **Page: `/app/videos/page.tsx`** (SIMPLIFIED)

**Before:**
- Had complex client-side polling logic (lines 93-144)
- Made 36 attempts polling every 10 seconds
- Handled timeout and retry logic on client

**After:**
- Removed ALL polling code
- Simply waits for API response
- Uses complete video data from response

**Removed Code (~50 lines):**
- Entire polling while loop
- Status check API calls
- Timeout handling
- Progress simulation during polling

**New Simplified Code:**
```typescript
const data = await response.json()
console.log("Video generation completed:", data)
setProgress(100)

// Create video generation record from the complete response
const generation: VideoGeneration = {
  id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  prompt: params.prompt,
  mode: params.mode,
  status: "complete",
  video_url: data.videoUrl, // Use the base64 data URL from API
  video_uri: data.videoUri, // Keep the original URI for reference
  resolution: params.resolution,
  aspect_ratio: params.aspectRatio,
  model: params.model,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

### 4. **Deleted Routes**

- **`/app/api/get-video-status/`** - No longer needed as polling is server-side

## Architecture Changes

### Before (Broken):
```
Client                    API                      Google Veo
  │                        │                           │
  ├─ POST /generate-video ──►                          │
  │                        ├─ generateVideos() ────────►
  │                        │                           │
  │◄─ operationName ───────┤                           │
  │                        │                           │
  ├─ POST /get-video-status─►                          │
  │                        ├─ getOperation() ──────────►
  │◄─ { done: false } ─────┤                           │
  │                        │                           │
  ├─ (wait 10s)            │                           │
  ├─ POST /get-video-status─►                          │
  │                        ├─ getOperation() ──────────►
  │◄─ { done: false } ─────┤                           │
  │                        │                           │
  ... (repeat ~36 times)   │                           │
  │                        │                           │
  ├─ POST /get-video-status─►                          │
  │                        ├─ getOperation() ──────────►
  │◄─ { done: true, uri }──┤                           │
  │                        │                           │
  └─ Display video         │                           │
```

### After (Fixed):
```
Client                    API                      Google Veo
  │                        │                           │
  ├─ POST /generate-video ──►                          │
  │                        ├─ generateVideos() ────────►
  │                        │                           │
  │                        ├─ (wait 10s)               │
  │                        ├─ getOperation() ──────────►
  │                        │◄─ { done: false } ────────┤
  │                        │                           │
  │                        ├─ (wait 10s)               │
  │                        ├─ getOperation() ──────────►
  │                        │◄─ { done: false } ────────┤
  │                        │                           │
  │                        ... (repeat until done)     │
  │                        │                           │
  │                        ├─ getOperation() ──────────►
  │                        │◄─ { done: true, uri } ────┤
  │                        │                           │
  │                        ├─ fetch(uri) ──────────────►
  │                        │◄─ video blob ─────────────┤
  │                        │                           │
  │◄─ complete video (base64)                          │
  │                        │                           │
  └─ Display video         │                           │
```

## Benefits

1. **Simpler Client Code**: No polling logic needed on client
2. **Single Request**: Client makes one request and waits for complete response
3. **Better Error Handling**: All errors handled in one place (server)
4. **Consistent with veo-studio**: Uses proven working implementation
5. **Proper Timeout**: 10 minutes server-side timeout vs client-side uncertainty
6. **Complete Video**: Returns ready-to-use base64 data URL

## Technical Details

### API Response Format

**Before:**
```json
{
  "videoUri": "operations/1234567890",
  "operationName": "operations/1234567890",
  "prompt": "...",
  "resolution": "720p",
  "aspectRatio": "16:9",
  "duration": 6
}
```

**After:**
```json
{
  "videoUrl": "data:video/mp4;base64,AAAAGGZ0eXBpc29tAAACAGlzb21pc28y...",
  "videoUri": "https://generativelanguage.googleapis.com/...",
  "prompt": "...",
  "resolution": "720p",
  "aspectRatio": "16:9",
  "duration": 6,
  "model": "veo-3.1-fast-generate-preview",
  "mode": "Text to Video"
}
```

### Polling Configuration

- **Interval**: 10 seconds (unchanged from veo-studio)
- **Max Attempts**: 60 (= 10 minutes total)
- **Timeout Handling**: Returns 504 Gateway Timeout if exceeded

### Supported Modes

All modes from veo-studio are supported:
- ✅ **Text to Video**: Generate from text prompt only
- ✅ **Frames to Video**: Generate between two frames (with looping option)
- ✅ **References to Video**: Generate using reference images + style
- ⚠️ **Extend Video**: Not yet implemented (returns 501)

## Testing

To test the fixed implementation:

1. Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local`
2. Start the development server: `pnpm dev`
3. Navigate to `/videos`
4. Try generating a video with mode "Text to Video"
5. Wait for the complete response (may take several minutes)
6. Video should display automatically when ready

## Known Limitations

1. **Max Duration**: 10 minutes server timeout (Next.js `maxDuration = 600`)
2. **Large Videos**: Base64 encoding increases payload size by ~33%
3. **Extend Video**: Not yet implemented (needs video object from previous generation)
4. **1080p Restriction**: Only supports 8s duration for 1080p (as per Google Veo API)

## Future Improvements

- [ ] Implement streaming response with progress updates (SSE)
- [ ] Add support for Extend Video mode
- [ ] Optimize video delivery (direct URL instead of base64 for large files)
- [ ] Add video caching to reduce regeneration
- [ ] Implement exponential backoff for polling retries
