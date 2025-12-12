# Creato - Video Generation Feature

**Status**: ✅ **Production Ready**

Advanced AI-powered video generation system integrated into Creato, leveraging Google's Gemini 2.0 and Veo 3.1 models.

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+ | pnpm
Google API Key (with video generation enabled)
Neon PostgreSQL Database
```

### Installation
```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables in .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_key
DATABASE_URL=your_neon_connection_string

# 3. Initialize database
psql $DATABASE_URL < db/schema.sql

# 4. Start development server
pnpm dev

# 5. Visit http://localhost:3000/videos
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **VIDEO_SETUP_GUIDE.md** | Complete setup instructions |
| **PROMPT_BEST_PRACTICES.md** | How to write effective prompts |
| **VIDEO_GENERATION_ADVANCED.md** | Technical deep dive |
| **VIDEOS_IMPLEMENTATION.md** | Implementation overview |
| **VERIFICATION_CHECKLIST.md** | Pre-deployment verification |
| **IMPLEMENTATION_SUMMARY.md** | Complete summary |

## 🎬 Features

### Four Generation Modes

#### 1. Text to Video
Generate videos from pure imagination using detailed text prompts.
- ✅ Unlimited creative freedom
- ✅ Support for negative prompts
- ✅ All parameters configurable
- ✅ Best for: Creative content, storytelling

#### 2. Frames to Video
Create smooth transitions between images with optional looping.
- ✅ Start and end frame uploads
- ✅ Looping capability
- ✅ Interpolation-based generation
- ✅ Best for: Transitions, animations, loops

#### 3. References to Video
Generate videos guided by reference images and optional style image.
- ✅ Up to 3 reference images
- ✅ Optional style image
- ✅ Maintains visual consistency
- ✅ Best for: Character consistency, brand adherence

#### 4. Extend Video
Seamlessly extend existing videos with additional footage.
- ✅ MP4 video file support
- ✅ Continuous narrative
- ✅ Maintains visual consistency
- ✅ Best for: Long-form content creation

### Advanced Parameters

| Parameter | Options | Notes |
|-----------|---------|-------|
| **Duration** | 4s, 6s, 8s | Affects processing time and quality |
| **Resolution** | 720p, 1080p | 1080p only available with 8s duration |
| **Aspect Ratio** | 16:9, 9:16 | Landscape or portrait orientation |
| **Model** | VEO_FAST, VEO | Speed vs. quality tradeoff |
| **Negative Prompt** | Optional | Describe what to avoid |

### Intelligent Validation

- ✅ Duration enumeration (4s|6s|8s only)
- ✅ 1080p + 8s duration enforcement
- ✅ Auto-adjustment of conflicting settings
- ✅ File type and size validation
- ✅ Real-time form validation
- ✅ Clear error messages

### User Experience

- ✅ Intuitive dark-themed interface
- ✅ Inline help text for every field
- ✅ Lightbulb tips for better prompts
- ✅ Warning alerts for constraints
- ✅ Image/video previews
- ✅ Realistic progress tracking
- ✅ Error recovery with retry
- ✅ Download with auto-naming

## 📊 Performance

| Configuration | Time | Quality |
|---------------|------|---------|
| 4s @ 720p | 1-2 min | Good |
| 6s @ 720p | 2-4 min | Very Good |
| 8s @ 720p | 3-6 min | Excellent |
| 4s @ 1080p | 2-3 min | Very Good |
| 6s @ 1080p | 4-6 min | Excellent |
| 8s @ 1080p | 6-12 min | Outstanding |

**Note**: Times are estimates. Actual duration depends on prompt complexity.

## 🔗 API Endpoints

### Generate Video
```bash
POST /api/generate-video
```
Generates a video based on mode and parameters.

### Save Video
```bash
POST /api/save-video
```
Saves generated video metadata to database.

### Get Videos
```bash
GET /api/get-videos
```
Retrieves video generation history.

### Delete Video
```bash
DELETE /api/delete-video
```
Soft-deletes a video (archived, not removed).

## 💡 Tips for Best Results

### Effective Prompts
1. **Be Descriptive**: Include subject, action, style, lighting
2. **Specify Camera**: Define angles, movements, perspective
3. **Set Atmosphere**: Include time of day, weather, mood
4. **Add Quality Keywords**: Use "cinematic", "professional", "hyperrealistic"
5. **Use Negative Prompts**: Avoid low-quality, artifacts, unwanted styles

### Example Prompt
```
"A majestic golden eagle soaring through snow-capped mountains,
slow cinematic tracking shot, epic fantasy atmosphere,
golden hour lighting with mystical mist, 4K professional quality"
```

### Generation Strategy
- **For Speed**: Use VEO_FAST + 4s + 720p
- **For Quality**: Use VEO + 8s + 1080p
- **For Balance**: Use VEO_FAST + 6s + 720p

## 🗄️ Database

The feature uses Neon PostgreSQL with a `videos` table supporting:

- ✅ Full CRUD operations
- ✅ Soft deletion (archive, don't remove)
- ✅ User tracking (ready for auth)
- ✅ Automatic timestamps
- ✅ Optimized indexes for performance
- ✅ Constraint validation

## 🔧 Configuration

### Environment Variables Required
```bash
GOOGLE_GENERATIVE_AI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://user:pass@host/db
```

### Optional Configuration
```bash
# Debug mode (check .env.local for more options)
DEBUG=creato:*
```

## 📁 File Structure

```
app/
├── api/
│   ├── generate-video/      # Main generation endpoint
│   ├── save-video/          # Database persistence
│   ├── get-videos/          # History retrieval
│   └── delete-video/        # Soft deletion
└── videos/
    ├── page.tsx             # Main video generation page
    └── layout.tsx           # Page metadata

components/
├── video-generator/
│   ├── video-generation-form.tsx    # User input form
│   └── video-result.tsx             # Result display
└── image-combiner/
    └── hooks/
        ├── use-video-generation.ts  # Generation state
        └── use-video-database.ts    # Database ops

types/
└── video.ts                         # TypeScript types

db/
└── schema.sql                       # Database schema
```

## 🎯 Use Cases

### 1. Social Media Content
- Quick 4s videos for TikTok, Reels, Shorts
- Portrait aspect ratio (9:16)
- VEO_FAST for rapid iteration
- Trending hooks and trends

### 2. Marketing & Advertising
- 6s product showcase videos
- Landscape aspect ratio (16:9)
- VEO standard model for quality
- Professional cinematography

### 3. Storytelling & Narrative
- 8s cinematic sequences
- 1080p for final quality
- Complex prompts with atmosphere
- Multiple related generations

### 4. Visual Effects & Transitions
- Frames to Video for morphing effects
- Looping backgrounds
- Smooth transitions between scenes
- References for character consistency

### 5. Content Creation
- Extend existing videos
- Add scenes before/after
- Maintain visual continuity
- Repurpose content

## ⚠️ Limitations & Constraints

1. **Duration**: Limited to 4s, 6s, or 8s
2. **1080p**: Only available with 8s duration
3. **Video Format**: Only MP4 supported for uploads
4. **File Size**: Recommended max 100MB for video uploads
5. **Processing Time**: Up to 12 minutes for 8s @ 1080p
6. **API Timeout**: 10-minute server timeout
7. **Prompt Length**: Maximum 2000 characters

## 🐛 Troubleshooting

### Video takes too long to generate
- Use 4s duration instead of 8s
- Use 720p instead of 1080p
- Use VEO_FAST model
- Simplify your prompt

### "1080p only supports 8 seconds duration"
- This is by design per Google's API
- Select 8 seconds if you want 1080p
- The form auto-adjusts duration when you select 1080p

### API key not found error
- Check `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY`
- Ensure key is valid and has video generation enabled
- Restart dev server after adding env var

### Database connection error
- Verify `DATABASE_URL` is set in `.env.local`
- Check connection string format
- Ensure Neon database is active
- Test connection manually

### Form validation keeps failing
- Ensure prompt is not empty (required)
- Check that duration is 4s, 6s, or 8s
- For 1080p, ensure duration is 8s
- Upload required files for mode

See **VIDEO_SETUP_GUIDE.md** for detailed troubleshooting.

## 📈 Monitoring & Analytics

### What to Track
- Generation success rate
- Average generation time
- Most used modes
- Prompt patterns
- Model preference (VEO_FAST vs VEO)

### Future Integration
- Usage analytics dashboard
- Webhook notifications
- Email on completion
- API rate limiting
- User quotas

## 🔐 Security Considerations

- ✅ API key stored in environment variables
- ✅ Input validation on frontend and backend
- ✅ Database constraint validation
- ✅ File type validation
- ✅ Size limit enforcement
- ✅ No sensitive data logged
- ⚠️ Ready for user authentication
- ⚠️ Ready for per-user quotas

## 🤝 Integration with Creato

The video generation feature integrates seamlessly with Creato:

- Uses same Google API key as image generation
- Uses same Neon database infrastructure
- Follows same design system (dark theme, Tailwind)
- Uses same navigation and layout patterns
- Type-safe throughout codebase
- No new external dependencies

## 📚 Additional Resources

### Google Documentation
- [Gemini API Reference](https://ai.google.dev/gemini-api)
- [Video Generation Guide](https://ai.google.dev/gemini-api/docs/video)
- [Veo 3.1 Specifications](https://ai.google.dev/models/veo)

### Project Documentation
- [Prompt Best Practices](./PROMPT_BEST_PRACTICES.md)
- [Advanced Technical Guide](./VIDEO_GENERATION_ADVANCED.md)
- [Setup Instructions](./VIDEO_SETUP_GUIDE.md)

## 🎉 Getting Started

1. **Setup**: Follow [VIDEO_SETUP_GUIDE.md](./VIDEO_SETUP_GUIDE.md)
2. **Learn**: Read [PROMPT_BEST_PRACTICES.md](./PROMPT_BEST_PRACTICES.md)
3. **Explore**: Try all 4 generation modes
4. **Create**: Generate your first video!

## 📞 Support

For issues or questions:

1. Check [VIDEO_SETUP_GUIDE.md](./VIDEO_SETUP_GUIDE.md) troubleshooting
2. Review [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)
3. Check browser console for errors
4. Review API response in Network tab
5. Check database connection in Neon Console

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Set all environment variables
2. ✅ Run database schema
3. ✅ Test all 4 modes
4. ✅ Monitor error handling
5. ✅ Set up error logging
6. ✅ Configure rate limiting
7. ✅ Test with real API key
8. ✅ Verify database backups

## 📋 Version History

- **v1.0** (2024) - Initial release
  - 4 generation modes
  - Advanced parameters
  - Database integration
  - Comprehensive documentation

## 📄 License

Part of Creato project. All rights reserved.

---

**Ready to generate amazing videos!** 🎬

Start with the [Setup Guide](./VIDEO_SETUP_GUIDE.md) →
