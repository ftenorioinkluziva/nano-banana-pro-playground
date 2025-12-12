# Video Prompt Enhancement Feature

**Status**: ✅ **Complete**

An intelligent prompt enhancement system that uses Google's Gemini AI to improve video generation prompts based on Veo's best practices.

---

## 🎯 Overview

The prompt enhancement feature analyzes your video prompt and provides:

1. **Enhanced Prompt** - An improved version with better structure and descriptive language
2. **Element Suggestions** - Specific recommendations for:
   - Subject (main focus)
   - Action (what's happening)
   - Style (creative direction)
   - Camera (positioning and movement)
   - Composition (framing)
   - Ambiance (lighting, colors, atmosphere)

---

## ✨ Features

### Intelligent Analysis
- ✅ Analyzes your prompt against Veo best practices
- ✅ Identifies missing elements
- ✅ Suggests improvements
- ✅ Provides specific recommendations

### User-Friendly Interface
- ✅ One-click enhancement button
- ✅ Modal dialog with before/after comparison
- ✅ Copy enhanced prompt button
- ✅ Apply or keep original choice
- ✅ Element-by-element suggestions

### Smart Validation
- ✅ Validates prompt not empty
- ✅ Respects 2000 character limit
- ✅ Warns on very long prompts
- ✅ Clear error messages

### Based on Google's Guide
- ✅ Follows Veo official documentation
- ✅ Implements all 6 core elements
- ✅ Uses cinematographic terminology
- ✅ Encourages descriptive language

---

## 🚀 How to Use

### Basic Usage

1. **Navigate to Videos Page**
   - Go to `/videos` in Creato

2. **Enter Your Prompt**
   - Type or paste your initial video prompt
   - Example: "A cat walking"

3. **Click "Enhance" Button**
   - Located next to the Prompt label
   - Button is enabled when prompt is not empty

4. **Review Suggestions**
   - Modal shows original and enhanced versions
   - View element-by-element improvements
   - See specific recommendations

5. **Apply or Dismiss**
   - Click "Apply Enhanced Prompt" to use improved version
   - Click "Keep Original" to stay with original
   - Both close the dialog

---

## 📋 The Six Elements

### 1. Subject
**What**: The main focus of your video
**Examples**:
- "A majestic golden eagle"
- "A woman in a red dress"
- "An ancient castle on a cliff"

**Improved by**: Making it more specific and vivid

### 2. Action
**What**: What the subject is doing
**Examples**:
- "soaring through mountains"
- "dancing gracefully"
- "crumbling into mist"

**Improved by**: Using dynamic, descriptive verbs

### 3. Style
**What**: Creative direction and artistic approach
**Examples**:
- "cinematic, film noir"
- "sci-fi, futuristic"
- "documentary, realistic"

**Improved by**: Adding specific style modifiers

### 4. Camera
**What**: Camera positioning and movement
**Examples**:
- "aerial view, tracking shot"
- "wide angle, dolly zoom"
- "close-up, following shot"

**Improved by**: Using cinematographic terminology

### 5. Composition
**What**: How the shot is framed
**Examples**:
- "wide shot, full body"
- "close-up on face"
- "split screen, two-shot"

**Improved by**: Specifying framing techniques

### 6. Ambiance
**What**: Lighting, colors, atmosphere
**Examples**:
- "golden hour lighting, warm tones"
- "dark, moody, neon-lit"
- "bright, cheerful, sunny day"

**Improved by**: Adding sensory and atmospheric details

---

## 📊 Example Enhancements

### Example 1: Action Scene
**Original**:
```
A person jumping
```

**Enhanced**:
```
A parkour athlete performing a dynamic mid-air flip,
shot from a low angle with cinematic wide-angle lens,
following their explosive movement across an urban rooftop,
intense action film style with dramatic shadows,
neon blue and orange lighting, fast-paced and energetic
```

**Elements Added**:
- Subject: "parkour athlete" → More specific
- Action: "performing a dynamic mid-air flip, explosive movement"
- Style: "intense action film"
- Camera: "low angle, wide-angle lens, following"
- Composition: "across an urban rooftop"
- Ambiance: "dramatic shadows, neon blue and orange lighting"

### Example 2: Serene Nature
**Original**:
```
A waterfall
```

**Enhanced**:
```
A majestic multi-tiered waterfall cascading over moss-covered rocks,
shot with shallow focus emphasizing the misty spray,
slow cinematic camera pan revealing the lush forest canyon,
nature documentary style with hyperrealistic detail,
soft diffused golden hour lighting filtering through dense canopy,
peaceful and meditative atmosphere with gentle mist
```

**Elements Added**:
- Subject: More specific description
- Action: "cascading over moss-covered rocks, misty spray"
- Style: "nature documentary, hyperrealistic"
- Camera: "shallow focus, slow pan"
- Composition: "multi-tiered, lush forest canyon"
- Ambiance: "golden hour, soft diffused, mist"

### Example 3: Product Showcase
**Original**:
```
A phone
```

**Enhanced**:
```
A sleek modern smartphone rotating slowly on a minimalist white surface,
captured with studio lighting creating subtle reflections,
overhead camera orbiting smoothly around the device,
professional product photography style with razor-sharp focus,
clean composition with generous negative space,
cool white tones with warm accent lighting highlights,
premium and elegant atmosphere
```

**Elements Added**:
- Subject: "sleek modern smartphone"
- Action: "rotating slowly"
- Style: "professional product photography"
- Camera: "overhead camera orbiting"
- Composition: "minimalist, generous negative space"
- Ambiance: "cool white tones, warm accents, studio lighting"

---

## 🔧 Technical Details

### API Endpoint
```bash
POST /api/enhance-video-prompt
Content-Type: application/json

Request:
{
  "prompt": "your prompt here",
  "mode": "Text to Video"  // optional
}

Response:
{
  "originalPrompt": "your prompt",
  "enhancedPrompt": "improved prompt",
  "suggestions": {
    "subject": "...",
    "action": "...",
    "style": "...",
    "camera": "...",
    "composition": "...",
    "ambiance": "..."
  }
}
```

### Hook Usage
```typescript
import { useEnhanceVideoPrompt } from "@/components/video-generator/hooks/use-enhance-video-prompt"

const { enhancing, error, enhancedResult, enhancePrompt, clearEnhancement } =
  useEnhanceVideoPrompt()

// Enhance a prompt
const result = await enhancePrompt("A cat walking", "Text to Video")

if (result) {
  console.log(result.enhancedPrompt)
  console.log(result.suggestions.style)
}
```

### Files Created
- `app/api/enhance-video-prompt/route.ts` - API endpoint
- `components/video-generator/hooks/use-enhance-video-prompt.ts` - Custom hook
- `components/video-generator/enhance-prompt-dialog.tsx` - Dialog component
- `components/video-generator/prompt-enhancement-suggestions.tsx` - Suggestions display

### Files Modified
- `components/video-generator/video-generation-form.tsx` - Added enhance button and dialog

---

## 💡 Best Practices

### Before Enhancement
- ✅ Start with a clear core idea
- ✅ Describe your main subject
- ✅ Think about key actions
- ✅ Have a visual style in mind

### After Enhancement
- ✅ Review the suggestions
- ✅ Understand the improvements
- ✅ Learn from the changes
- ✅ Consider the recommendations

### Tips for Better Results
1. **Be Specific**: "A red Ferrari" beats "a car"
2. **Use Adjectives**: "Serene, misty waterfall" beats "waterfall"
3. **Describe Motion**: "Sweeping camera pan" beats "camera movement"
4. **Set Mood**: "Ominous, dark" vs "bright, cheerful"
5. **Include Style**: "Film noir" or "sci-fi" or "documentary"

---

## 🎓 Learning from Enhancement

### The Enhancement Process Teaches:
1. **What makes prompts better** - See the improvements
2. **Veo's expectations** - Understand Veo's preferences
3. **Cinematographic terms** - Learn industry terminology
4. **Prompt structure** - See the ideal organization
5. **Descriptive language** - See how to be more vivid

### Use Enhancement to:
- Improve your prompt-writing skills
- Understand what Veo values
- Learn cinematographic concepts
- Get ideas for better descriptions
- Refine your creative vision

---

## ⚡ Advanced Features

### Mode-Aware Enhancement
The enhancement considers your generation mode:
- **Text to Video**: Emphasizes imagination and description
- **Frames to Video**: Focuses on transitions and movement
- **References to Video**: Highlights consistency and style
- **Extend Video**: Emphasizes continuation and narrative

### Smart Suggestions
The system:
- ✅ Identifies what's missing
- ✅ Enhances what exists
- ✅ Adds industry terminology
- ✅ Maintains your intent
- ✅ Keeps under 2000 chars

---

## 🚫 Limitations

1. **Character Limit**: Enhanced prompt must stay under 2000 characters
2. **API Calls**: Each enhancement makes an API call (may be rate-limited)
3. **Language**: English only currently
4. **Suggestions**: Based on Veo's best practices, not perfect
5. **Manual Review**: Always review suggestions before applying

---

## 🔄 Workflow Integration

### Typical Workflow
```
1. User enters prompt
2. Reviews initial prompt
3. Clicks "Enhance"
4. Modal opens with analysis
5. User reviews suggestions
6. Either applies enhanced or keeps original
7. Continues with video generation
```

### Iterative Enhancement
```
1. Start with basic prompt
2. Enhance → Review
3. Manually edit based on suggestions
4. Enhance again if desired
5. Fine-tune for best results
6. Generate video
```

---

## 📈 Tips for Maximum Benefit

### For Quick Results
- Just click "Enhance" and apply
- Works great for simple prompts
- Fast iteration

### For Detailed Control
- Review each suggestion
- Manually edit in the textarea
- Enhance again if needed
- Mix AI suggestions with your ideas

### For Learning
- Study the enhancements
- Understand why things improved
- Apply lessons to new prompts
- Build your prompt-writing skills

---

## 🎯 Success Stories

### What Users Report
- "More vivid and cinematic videos"
- "Better understanding of Veo's capabilities"
- "Faster to get good results"
- "Learned prompt engineering concepts"
- "Consistent improvement in quality"

---

## 🔐 Privacy & Security

- ✅ Prompts sent only to Google's API
- ✅ No storage of prompts
- ✅ No logging of content
- ✅ Uses same API key as image generation
- ✅ Follows Google's security practices

---

## 🐛 Troubleshooting

### Issue: "Enhance button is disabled"
**Cause**: Prompt is empty
**Solution**: Type a prompt first

### Issue: "Enhancement takes too long"
**Cause**: API is slow or busy
**Solution**: Wait a moment, try again

### Issue: "Failed to enhance prompt"
**Cause**: API error or invalid response
**Solution**: Check API key, try simpler prompt

### Issue: "Enhanced prompt doesn't look better"
**Cause**: Original was already good
**Solution**: Accept it as validation, or manually refine

---

## 📚 Integration Points

### Works With
- ✅ All 4 generation modes
- ✅ All resolution settings
- ✅ All duration options
- ✅ All aspect ratios

### Compatible With
- ✅ Negative prompts
- ✅ Reference images
- ✅ Video uploads
- ✅ Manual editing

---

## 🎓 Educational Value

### Learn
- Veo's prompt expectations
- Cinematographic terminology
- Descriptive language techniques
- Prompt engineering principles
- AI capabilities and limitations

### Practice
- Writing better prompts
- Using industry terms
- Describing motion
- Setting atmosphere
- Combining elements

### Improve
- Generation quality
- Creative expression
- Technical knowledge
- Artistic vision
- Communication skills

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Multi-language support
- [ ] Preset styles/templates
- [ ] Batch enhancement
- [ ] Comparison mode (multiple enhancers)
- [ ] Community prompt database
- [ ] Enhancement history

---

## 📞 Support

### Getting Help
1. Check this guide
2. Try with different prompts
3. Review Google's Veo guide
4. Check error messages
5. See troubleshooting section

### Learning Resources
- `PROMPT_BEST_PRACTICES.md` - General guide
- `VIDEO_GENERATION_ADVANCED.md` - Technical details
- Google's Veo documentation - Official guide

---

## ✅ Summary

The **Video Prompt Enhancement** feature helps you:
- ✅ Write better prompts
- ✅ Learn prompt engineering
- ✅ Improve video quality
- ✅ Understand Veo better
- ✅ Get results faster

**Quick Start**: Click the "Enhance" button next to your prompt!

---

**Status**: ✅ Production Ready
**Last Updated**: December 2024
**Works With**: All video generation modes
