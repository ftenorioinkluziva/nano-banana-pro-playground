# KIE.AI Fallback Implementation Guide

## Overview

The video generation system now supports **automatic fallback** from Google Veo to KIE.AI when quota limits are exceeded. This ensures uninterrupted service even when Google's API quota is exhausted.

## How It Works

### Automatic Fallback Flow

```
1. User requests video generation
   ↓
2. System tries Google Veo API first
   ↓
3. If Google returns 429 (quota exceeded):
   ├─ Switch to KIE.AI automatically
   ├─ Generate video using KIE.AI
   └─ Return video with provider='kieai'
   ↓
4. If Google succeeds:
   └─ Return video with provider='google'
```

### Provider Modes

Set `VIDEO_PROVIDER` environment variable to control behavior:

- **`auto`** (default): Try Google first, fallback to KIE.AI on quota errors
- **`google`**: Use only Google Veo (fail if quota exceeded)
- **`kieai`**: Use only KIE.AI (skip Google entirely)

## Environment Variables

### Required for Google Veo

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
```

Get your key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)

### Required for KIE.AI Fallback

```env
KIEAI_API_KEY=your_kieai_api_key_here
```

Get your key from [KIE.AI API Key Management](https://kie.ai/api-key)

### Optional: Provider Selection

```env
VIDEO_PROVIDER=auto
# Options: "auto" | "google" | "kieai"
# Default: "auto"
```

## Example .env.local File

```env
# Google Veo API (Primary)
GOOGLE_GENERATIVE_AI_API_KEY=sk_xxx_your_google_key

# KIE.AI API (Fallback)
KIEAI_API_KEY=sk_xxx_your_kieai_key

# Provider mode (optional)
VIDEO_PROVIDER=auto

# Database (for history)
DATABASE_URL=postgresql://...
```

## Feature Comparison

### Google Veo Features

✅ **Text to Video**
✅ **Frames to Video** (with start/end frames)
✅ **References to Video** (with reference images)
✅ **Resolution**: 720p, 1080p
✅ **Aspect Ratios**: 16:9, 9:16
✅ **Duration**: 4s, 6s, 8s
✅ **Models**: veo-3.1-generate-preview, veo-3.1-fast-generate-preview

### KIE.AI Features

✅ **Text to Video**
⚠️ **Frames to Video** (API supports it, but requires image URL hosting - not yet implemented)
⚠️ **References to Video** (API supports it, but requires image URL hosting - not yet implemented)
✅ **Resolution**: Automatic (based on aspect ratio)
✅ **Aspect Ratios**: 16:9, 9:16, Auto
✅ **Duration**: Based on model
✅ **Models**: veo3, veo3_fast
✅ **Pricing**: Claims 25% of Google's pricing
✅ **Multilingual**: Better non-English prompt support

## Current Limitations

### KIE.AI Fallback

1. **Only Text to Video mode** is currently supported in fallback
2. **Image-based modes** (Frames to Video, References to Video) require image hosting
   - KIE.AI API expects image URLs, not base64
   - Need to implement image upload service (Cloudinary, Imgur, etc.)
3. **No Extend Video** support yet

### Why Image Modes Aren't Supported Yet

KIE.AI's API requires images to be provided as URLs:

```json
{
  "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}
```

But our current implementation uses base64 images from file uploads. To support image modes with KIE.AI, we would need to:

1. Upload user images to a hosting service (e.g., Cloudinary)
2. Get public URLs for the uploaded images
3. Pass those URLs to KIE.AI

This is planned for future implementation.

## API Response Differences

### Google Veo Response

```json
{
  "videoUrl": "data:video/mp4;base64,AAAA...",
  "videoUri": "https://generativelanguage.googleapis.com/...",
  "prompt": "A cat playing piano",
  "resolution": "720p",
  "aspectRatio": "16:9",
  "duration": 6,
  "model": "veo-3.1-fast-generate-preview",
  "mode": "Text to Video",
  "provider": "google"
}
```

### KIE.AI Response

```json
{
  "videoUrl": "data:video/mp4;base64,AAAA...",
  "videoUri": "https://kie.ai/storage/videos/...",
  "prompt": "A cat playing piano",
  "resolution": "720p",
  "aspectRatio": "16:9",
  "duration": 6,
  "model": "veo-3.1-fast-generate-preview",
  "mode": "Text to Video",
  "provider": "kieai"
}
```

Both return the same structure. The `provider` field indicates which API was used.

## Error Handling

### Quota Error with Auto Fallback

```
User Request (Text to Video)
  ↓
Google API → 429 Quota Exceeded
  ↓
System: "Google quota exceeded, falling back to KIE.AI..."
  ↓
KIE.AI API → Success
  ↓
Return video with provider='kieai'
```

### Quota Error with Image Mode

```
User Request (Frames to Video)
  ↓
Google API → 429 Quota Exceeded
  ↓
System: "Image modes not supported in fallback"
  ↓
Return 429 error to user
```

### Both Providers Fail

```
User Request (Text to Video)
  ↓
Google API → 429 Quota Exceeded
  ↓
KIE.AI API → Also Fails
  ↓
Return 500 error with details from both providers
```

## Testing the Fallback

### Test with Auto Mode (Default)

1. Set `.env.local`:
   ```env
   VIDEO_PROVIDER=auto
   GOOGLE_GENERATIVE_AI_API_KEY=invalid_key
   KIEAI_API_KEY=valid_kieai_key
   ```

2. Try generating a Text to Video
3. Google will fail with quota/auth error
4. System should automatically fallback to KIE.AI
5. Video should generate successfully

### Test with KIE.AI Only

1. Set `.env.local`:
   ```env
   VIDEO_PROVIDER=kieai
   KIEAI_API_KEY=your_kieai_key
   ```

2. Try generating a Text to Video
3. System skips Google entirely
4. Video generates using KIE.AI

### Test Error Handling

1. Set `.env.local`:
   ```env
   VIDEO_PROVIDER=auto
   GOOGLE_GENERATIVE_AI_API_KEY=invalid_key
   # Don't set KIEAI_API_KEY
   ```

2. Try generating a video
3. Google fails → tries KIE.AI → KIE.AI fails (no key)
4. Should return error: "Both video providers failed"

## Logs to Watch

When fallback occurs, you'll see these logs:

```
Submitting video generation request...
Provider preference: auto
Using Google Veo provider...
Google Veo error: [Error with quota/429]
Google quota exceeded, falling back to KIE.AI...
Using KIE.AI provider...
Starting KIE.AI video generation...
KIE.AI task created: task_abc123
KIE.AI polling... (attempt 1/60)
...
KIE.AI video generation complete: https://kie.ai/storage/videos/...
Video fetched successfully, size: 5242880 bytes
```

## Pricing Comparison

### Google Veo Pricing (Estimated)

- **Text to Video**: ~$0.10 per video
- **Image to Video**: ~$0.15 per video
- **Free tier**: Limited quota per month

### KIE.AI Pricing

- Claims **25% of Google's pricing**
- **Text to Video**: ~$0.025 per video (estimated)
- Check [KIE.AI Pricing](https://kie.ai/pricing) for current rates

## Future Improvements

- [ ] Implement image hosting service (Cloudinary/Imgur)
- [ ] Support all modes in KIE.AI fallback
- [ ] Add smart routing based on cost
- [ ] Implement rate limit tracking for both providers
- [ ] Add fallback preference per mode
- [ ] Cache video results to reduce API calls
- [ ] Add webhook support for async notifications

## Getting KIE.AI API Key

1. Visit [KIE.AI](https://kie.ai)
2. Sign up for an account
3. Navigate to [API Key Management](https://kie.ai/api-key)
4. Generate a new API key
5. Copy the key to your `.env.local` file

## Support

- **Google Veo Docs**: https://ai.google.dev/gemini-api/docs
- **KIE.AI Docs**: https://docs.kie.ai/veo3-api
- **Rate Limits**: https://ai.google.dev/gemini-api/docs/rate-limits
