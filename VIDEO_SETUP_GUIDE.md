# Video Generation Feature - Setup Guide

## 📋 Prerequisites

Before you can use the video generation feature, ensure you have:

1. **Node.js & pnpm** - Installed and working
2. **Google API Key** - For Gemini API access
3. **Neon PostgreSQL Database** - Connected and configured
4. **Environment Variables** - Properly set

## 🔧 Step-by-Step Setup

### Step 1: Install Dependencies

The required packages are already in `package.json`. Just install them:

```bash
pnpm install
```

**Key dependencies:**
- `@google/generative-ai` - Google AI SDK for video generation
- `@neondatabase/serverless` - Neon database connection
- `@ai-sdk/google` - AI SDK integration

### Step 2: Set Environment Variables

Create or update your `.env.local` file with:

```bash
# Google API Configuration
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@host/database
```

**Getting a Google API Key:**
1. Go to [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
2. Click "Create API Key"
3. Copy the key and paste it in `.env.local`

**Getting Database URL:**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Copy the connection string
4. Paste in `DATABASE_URL`

### Step 3: Set Up Database Schema

The video generation feature requires a `videos` table in your database.

**Option A: Run Schema Directly (Recommended)**

```bash
# Run the SQL schema
psql $DATABASE_URL < db/schema.sql
```

**Option B: Manual Setup**

1. Open your Neon Console
2. Go to the SQL Editor
3. Copy the entire content of `db/schema.sql`
4. Paste and execute

**What gets created:**
- `videos` table with all necessary columns
- Indexes for performance
- Triggers for automatic timestamp updates
- Constraints for data validation

### Step 4: Start Development Server

```bash
pnpm dev
```

The app will start at `http://localhost:3000`

### Step 5: Test the Feature

1. Open your browser to `http://localhost:3000`
2. Navigate to **Videos** in the menu
3. Select **Text to Video** mode
4. Enter a test prompt: "A golden retriever running through a meadow"
5. Click **Generate Video**
6. Wait for completion (5-15 minutes depending on duration/resolution)

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Environment variables are set correctly
- [ ] `pnpm install` completed without errors
- [ ] Development server starts with `pnpm dev`
- [ ] `/videos` page loads without errors
- [ ] Can select different generation modes
- [ ] Database connection is working
- [ ] Can submit a generation request
- [ ] No console errors in browser DevTools

## 🐛 Troubleshooting

### Issue: "No Google API key configured"
**Solution:**
- Check `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY`
- Restart dev server after adding env vars
- Verify key is valid in Google AI Studio

### Issue: "DATABASE_URL environment variable is not set"
**Solution:**
- Add `DATABASE_URL` to `.env.local`
- Use the full PostgreSQL connection string from Neon
- Restart dev server

### Issue: "relation 'videos' does not exist"
**Solution:**
- Run the schema: `psql $DATABASE_URL < db/schema.sql`
- Check that schema executed without errors
- Verify in Neon console that `videos` table exists

### Issue: Video generation is slow
**Solutions:**
- Use `VEO_FAST` model instead of `VEO`
- Reduce duration to 4s
- Use 720p instead of 1080p
- Simplify your prompt

### Issue: "Invalid duration. Must be one of: 4s, 6s, 8s"
**Solution:**
- Duration is strict: must be exactly "4s", "6s", or "8s"
- The form should prevent invalid selections
- If error persists, check browser console

### Issue: "1080p resolution only supports 8 seconds duration"
**Solution:**
- This is by design per Google's API
- Select 8 seconds duration if you want 1080p
- The form auto-adjusts duration when selecting 1080p

### Issue: "Cannot find module '@google/generative-ai'"
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 🚀 First Generation Test

### Simple Test Prompt
```
"A calm sunset over a mountain lake, cinematic, peaceful atmosphere"
```

### Settings
- Mode: Text to Video
- Model: Veo Fast (for speed)
- Duration: 4 seconds
- Resolution: 720p
- Aspect Ratio: Landscape (16:9)

## 📊 Database Verification

To verify the database is set up correctly:

```sql
-- Check if videos table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'videos';

-- Check videos table structure
\d videos

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'videos';
```

## 📝 Configuration Options

### Google API
- Uses the same API key as image generation
- Supports video-specific models (VEO)
- Requires valid API key with video generation enabled

### Database
- Uses Neon PostgreSQL
- Automatically handles timestamps
- Supports soft deletes (deleted_at)
- Includes proper indexing

### Environment Variables
```bash
# Required
GOOGLE_GENERATIVE_AI_API_KEY=...
DATABASE_URL=...

# Optional (used in other features)
GOOGLE_API_KEY=...
```

## 🔄 Development Workflow

### Adding New Features
1. Update types in `types/video.ts`
2. Update API routes as needed
3. Update frontend components
4. Test with dev server
5. Check database updates

### Testing Locally
1. Use VEO_FAST model for quick testing
2. Use 4s duration for fastest generation
3. Use 720p resolution for speed
4. Simple prompts for faster results

### Production Checklist
- [ ] All env vars are set
- [ ] Database is backed up
- [ ] API keys are secure
- [ ] Error handling is tested
- [ ] Database migrations are done
- [ ] Load testing completed

## 📞 Support Resources

### Official Documentation
- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs/video)
- [Neon Database Docs](https://neon.tech/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Feature Guides
- `PROMPT_BEST_PRACTICES.md` - How to write good prompts
- `VIDEO_GENERATION_ADVANCED.md` - Technical details
- `VIDEOS_IMPLEMENTATION.md` - Implementation overview

## 🎉 You're Ready!

Once all steps are complete, your video generation feature is ready to use.

**Next Steps:**
1. Explore the video generation page
2. Try different generation modes
3. Experiment with prompts
4. Check the documentation for advanced techniques
5. Monitor generation performance

---

**Last Updated:** 2024
**Status:** Ready for Production ✅
