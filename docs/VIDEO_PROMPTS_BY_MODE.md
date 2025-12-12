# Video Prompts by Generation Mode

Comprehensive guide for writing effective prompts for each of Veo's 4 generation modes.

---

## 1️⃣ TEXT TO VIDEO MODE

**Best For**: Creating videos from pure imagination

### What You Control
- ✅ Complete creative freedom
- ✅ Subject, action, style, camera, composition, ambiance
- ✅ No reference constraints
- ✅ Unlimited possibilities

### Prompt Structure
```
[SUBJECT] [ACTION], [STYLE] [MOOD],
[CAMERA] [COMPOSITION], [AMBIANCE] [QUALITY]
```

### Example Prompts

#### Action/Adventure
```
A parkour athlete performing acrobatic flips between rooftops
in a cyberpunk cityscape, fast-paced action film style,
wide shots transitioning to dynamic close-ups, neon blue and
purple lighting with rain-slicked surfaces, hyperrealistic 4K quality,
cinematic camera movements with tracking shots
```

#### Serene/Peaceful
```
A lone figure meditating on a misty mountain peak at sunrise,
soft golden light filtering through clouds, peaceful documentary style,
slow cinematic pan revealing expansive landscape, warm earth tones
with blue shadows, shallow depth of field, tranquil and contemplative
atmosphere, professional nature photography quality
```

#### Fantasy/Magical
```
A majestic phoenix rising from flames in a dark mystical temple,
magical fantasy style with glowing ethereal effects, wide establishing
shot zooming to close-up, dramatic orange and crimson lighting with
deep shadows, cinematic fantasy movie quality, mystical and powerful
atmosphere
```

#### Sci-Fi/Futuristic
```
A sleek spaceship descending through Earth's atmosphere during a
thunderstorm, sci-fi thriller style with advanced technology,
aerial wide shots with dynamic camera movement, cool blue and electric
purple lighting, futuristic and ominous mood, 4K professional cinema
quality
```

### Pro Tips for Text to Video
1. **Be Hyper-Descriptive** - More details = better results
2. **Use Adjectives** - "graceful dancer" beats "dancer"
3. **Specify Lighting** - "golden hour with soft bokeh" matters
4. **Describe Mood** - "energetic and joyful" sets tone
5. **Include Camera** - "dolly zoom" is better than "camera movement"
6. **Set Atmosphere** - "foggy morning" creates texture

### Common Mistakes to Avoid
❌ Too short: "A person running"
❌ Vague adjectives: "nice, cool, good"
❌ Instructional tone: "don't include, avoid, make sure"
❌ No camera info: Specify how you want it framed
❌ Generic style: Be specific - "film noir" not "dark"

---

## 2️⃣ FRAMES TO VIDEO MODE

**Best For**: Smooth transitions between two images

### What You Control
- ✅ Start frame (required)
- ✅ End frame (optional)
- ✅ Transition description
- ✅ Looping capability
- ✅ Motion direction

### Frame Requirements
```
Start Frame (REQUIRED):
- Clear, high-quality image
- Well-composed scene
- Clearly defined subject

End Frame (OPTIONAL):
- Similar composition
- Clear visual difference
- Logical transition point

Looping Option:
- Enabled: Returns to start frame
- Disabled: Stays at end frame
```

### Prompt Structure
```
[DESCRIBE START → END] [TRANSITION TYPE],
[MOTION QUALITY], [STYLE], [LIGHTING CONTINUITY]
```

### Example Prompts

#### Image Interpolation
```
Smooth morphing transition between a blooming flower and a wilted petal,
graceful transformation with flowing motion, maintaining natural lighting
continuity, gentle and poetic style, shallow focus effects throughout,
seamless morphing animation quality
```

#### Loop Transition
```
A spinning vinyl record rotating continuously from above,
smooth 360-degree rotation loop, maintaining consistent lighting,
professional product photography style, sharp focus on details,
hypnotic and meditative quality
```

#### Camera Movement
```
Smooth camera fly-through between two mountain vistas,
transitioning from peak to valley with aerial perspective,
cinematic landscape style, golden hour lighting consistent,
wide shots with depth perception, breathtaking quality
```

#### Scene Change
```
Seamless transition from underwater coral reef to beach sand,
flowing transition revealing both environments, maintaining
consistent oceanic color grading, documentary nature style,
detailed and immersive quality
```

### Pro Tips for Frames to Video
1. **Quality Frames** - Ensure frames are high-quality
2. **Logical Transition** - Frames should relate somehow
3. **Motion Direction** - Describe the movement clearly
4. **Lighting Consistency** - Maintain color tone
5. **Smooth Movement** - Specify smooth, flowing motion
6. **Loop Consideration** - If looping, frames should connect

### Frame Selection Tips
- ✅ Use high-resolution images (2K+ recommended)
- ✅ Ensure adequate lighting in both frames
- ✅ Match approximate compositions
- ✅ Similar color palettes help
- ✅ Clear subjects in each frame
- ✅ Avoid extreme perspective changes

---

## 3️⃣ REFERENCES TO VIDEO MODE

**Best For**: Maintaining visual consistency with guidance

### What You Control
- ✅ Reference images (1-3)
- ✅ Style image (optional)
- ✅ Generation prompt
- ✅ How to blend them

### Reference Types
```
ASSET References:
- Character/subject consistency
- Environment details
- Props and objects
- Structural elements

STYLE Reference:
- Artistic direction
- Color palette
- Lighting style
- Overall aesthetic
```

### Prompt Structure
```
[CREATE VIDEO] [WITH ELEMENTS FROM REFERENCES],
[BLEND INSTRUCTION], [STYLE GUIDANCE],
[CINEMATIC APPROACH], [FINAL ATMOSPHERE]
```

### Example Prompts

#### Character Consistency
```
Create a video of the character from the reference performing
graceful ballet movements across a moonlit stage, maintaining
character appearance and clothing details from the reference image,
cinematic ballet performance style, elegant and dramatic lighting,
smooth camera movements following the subject, professional stage
production quality, consistent character design throughout
```

#### Environmental Consistency
```
Generate a video within the landscape from the reference image,
showing a hidden waterfall cascade down the moss-covered cliffs,
maintaining the forest environment details and color grading from
the reference, nature documentary style, atmospheric and immersive,
soft natural lighting matching reference ambiance, 4K quality
```

#### Style Consistency
```
Create a video in the artistic style of the style reference image,
showing a sunset landscape with mountains and valleys, adopting the
color palette and artistic treatment from the style reference,
painterly and stylized approach, warm sunset colors with golden
lighting, dreamlike and artistic quality, maintaining style consistency
```

#### Product Showcase
```
Generate a rotating product video incorporating design elements from
the reference images, showing the product from multiple angles,
maintaining material appearance from references, professional product
photography style, studio lighting with subtle reflections, smooth
360-degree rotation, premium and polished presentation
```

### Pro Tips for References to Video
1. **High-Quality References** - Crisp, well-lit images
2. **Clear Subjects** - Easy to identify what to recreate
3. **Color Consistency** - Maintain reference colors
4. **Detail Mention** - Call out specific details to keep
5. **Style Clarity** - If using style ref, be explicit
6. **Multiple Refs** - Use 1-3 for different aspects

### Reference Image Tips
- ✅ Clear, high-resolution images
- ✅ Well-composed shots
- ✅ Adequate lighting
- ✅ Clear subjects/focus
- ✅ Professional quality
- ✅ Consistent style between refs

---

## 4️⃣ EXTEND VIDEO MODE

**Best For**: Continuing or expanding existing videos

### What You Control
- ✅ Input video (MP4)
- ✅ Continuation direction
- ✅ Narrative flow
- ✅ Camera consistency
- ✅ Fixed resolution (720p)
- ✅ Fixed duration (8s)

### Video Requirements
```
Format: MP4 only
Quality: 720p or lower
Duration: Reasonable length
Content: Clear continuation point
Composition: Stable camera preferable
```

### Prompt Structure
```
[CONTINUE FROM VIDEO], [NARRATIVE DIRECTION],
[CAMERA CONSISTENCY], [STYLE MAINTENANCE],
[SMOOTH TRANSITION], [FINAL STATE/MOOD]
```

### Example Prompts

#### Narrative Extension
```
The character walks through the doorway and discovers a hidden library,
continuing the cinematic adventure story, maintaining the warm
candlelit lighting and antique aesthetic from the original video,
smooth camera following the character's journey, seamless visual
connection to previous footage, professional cinematography quality,
mysterious and inviting atmosphere
```

#### Environmental Expansion
```
Camera pulls back from the waterfall to reveal the surrounding canyon,
expanding the landscape view shown in the original video, maintaining
the golden hour lighting and earthy color palette, smooth tracking
shot revealing more environment, consistent nature documentary style,
immersive and breathtaking quality
```

#### Action Continuation
```
The athlete lands the jump and continues running across the rooftop,
maintaining the parkour action sequence momentum, keeping the dynamic
cinematic style and neon cyberpunk lighting from the original,
consistent camera movement speed and energy level, professional
action film quality, thrilling and exciting continuation
```

#### Loop Extension
```
The spinning record continues rotating with additional decorative
elements appearing gradually, maintaining the smooth rotation motion
and studio lighting from the original, consistent professional
photography style, hypnotic and visually engaging extension,
seamless loop continuity when combined with original
```

### Pro Tips for Extend Video
1. **Watch Original** - Understand ending and mood
2. **Match Style** - Maintain lighting, color, tone
3. **Smooth Transition** - Describe seamless connection
4. **Camera Match** - Keep similar camera speed/angle
5. **Narrative Flow** - Logical continuation
6. **Test First** - Consider generating separately first

### Video Preparation Tips
- ✅ Ensure MP4 format
- ✅ Clear ending state
- ✅ Good lighting quality
- ✅ Stable camera work
- ✅ Clear action/subject
- ✅ Reasonable quality

---

## 📊 Mode Comparison

| Aspect | Text to Video | Frames to Video | References | Extend |
|--------|---|---|---|---|
| **Creative Freedom** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Consistency Guarantee** | Low | Medium | High | Very High |
| **Prompt Complexity** | High | Medium | High | Medium |
| **Input Requirements** | Text only | 1-2 Images | 1-3 Images | 1 Video |
| **Best Use Case** | Imagination | Transitions | Consistency | Continuation |
| **Prompt Focus** | Description | Motion | Blending | Narrative |

---

## 🎓 Cross-Mode Prompt Tips

### Universal Good Practices
1. **Be Descriptive** - All modes benefit from vivid language
2. **Use Adjectives** - Enrich description with modifiers
3. **Specify Camera** - Movement matters in all modes
4. **Set Mood** - Atmosphere enhances all generations
5. **Consider Style** - Consistent style improves results
6. **Quality Words** - "cinematic," "professional," etc.

### Mode-Specific Emphasis
```
TEXT TO VIDEO:
Focus on: Description, Atmosphere, Mood, Style
Prompt Length: Can be longer (1500+ chars helps)
Detail Level: Maximum detail beneficial

FRAMES TO VIDEO:
Focus on: Motion, Transition, Flow, Continuity
Prompt Length: Medium (500-1000 chars)
Detail Level: Describe the transition clearly

REFERENCES TO VIDEO:
Focus on: Blending, Consistency, Integration
Prompt Length: Medium (600-1200 chars)
Detail Level: Reference specific elements

EXTEND VIDEO:
Focus on: Continuation, Flow, Style Match
Prompt Length: Shorter (300-800 chars)
Detail Level: Describe next action clearly
```

---

## 🚀 Quick Prompt Templates

### Text to Video Template
```
A [SUBJECT] [ACTION], [CINEMATOGRAPHY],
[STYLE] [MOOD], [CAMERA MOVEMENT],
[LIGHTING] [AMBIANCE], [QUALITY] [DETAIL]
```

### Frames to Video Template
```
[SMOOTH/FLOWING] transition from [START] to [END],
[MOTION TYPE], [STYLE], [LIGHTING CONSISTENCY],
[QUALITY] interpolation
```

### References to Video Template
```
Generate [SUBJECT] [ACTION] using reference elements,
[HOW TO BLEND], maintaining [SPECIFIC DETAILS],
[STYLE], [LIGHTING], [QUALITY] result
```

### Extend Video Template
```
Continue from [END STATE], [NEXT ACTION/DIRECTION],
maintaining [CONSISTENCY POINTS], [STYLE],
[CAMERA MATCH], [FINAL MOOD/ATMOSPHERE]
```

---

## 🎯 Practice Exercises

### Exercise 1: Text to Video
1. Pick a simple idea (e.g., "A cat sleeping")
2. Expand with adjectives
3. Add camera direction
4. Include lighting/mood
5. Enhance with AI
6. Generate and evaluate

### Exercise 2: Mode Matching
1. Generate text to video version
2. Create frames for frames to video
3. Find references for references mode
4. Use frame as input for extend
5. Compare results

### Exercise 3: Style Consistency
1. Choose a visual style (e.g., "noir")
2. Write prompt emphasizing style
3. Use enhancement to refine
4. Generate across modes
5. Evaluate consistency

---

## 📈 Iterative Improvement

### Feedback Loop
```
1. Write Initial Prompt
           ↓
2. Enhance with AI
           ↓
3. Review Suggestions
           ↓
4. Manually Refine
           ↓
5. Generate Video
           ↓
6. Evaluate Results
           ↓
7. Adjust & Repeat
```

---

## ✅ Prompt Checklist by Mode

### Text to Video Checklist
- [ ] Subject clearly described
- [ ] Action/movement specified
- [ ] Style/genre defined
- [ ] Camera movement included
- [ ] Lighting described
- [ ] Mood/atmosphere set
- [ ] Quality words used
- [ ] Under 2000 characters
- [ ] Adjectives and adverbs included
- [ ] Runs through enhancement

### Frames to Video Checklist
- [ ] Start frame selected (high quality)
- [ ] End frame selected (logical progression)
- [ ] Transition type described
- [ ] Motion quality specified
- [ ] Style consistency mentioned
- [ ] Lighting continuity addressed
- [ ] Looping option considered
- [ ] Prompt under 1000 characters
- [ ] Describes the "in-between" motion
- [ ] Enhancement applied

### References to Video Checklist
- [ ] 1-3 reference images selected
- [ ] Style image chosen (if needed)
- [ ] How to blend references described
- [ ] Specific elements to maintain called out
- [ ] Style guidance clear
- [ ] Lighting consistency addressed
- [ ] Subject action defined
- [ ] Prompt 600-1200 characters
- [ ] Integration instructions clear
- [ ] Enhancement completed

### Extend Video Checklist
- [ ] Input video selected (MP4, 720p)
- [ ] Clear ending state understood
- [ ] Continuation direction defined
- [ ] Camera consistency maintained
- [ ] Style/tone matched
- [ ] Smooth transition described
- [ ] Final state/mood specified
- [ ] Prompt 300-800 characters
- [ ] Logical narrative flow
- [ ] Enhancement applied

---

## 💡 Final Tips

### Before Generating
1. ✅ Use enhancement for better prompts
2. ✅ Follow mode-specific structure
3. ✅ Include all 6 elements when possible
4. ✅ Use specific descriptive language
5. ✅ Consider your target quality/style

### During Generation
1. ✅ Monitor progress
2. ✅ Be patient (5-15 minutes normal)
3. ✅ Note generation settings
4. ✅ Review results carefully

### After Generation
1. ✅ Evaluate quality
2. ✅ Note what worked
3. ✅ Learn from results
4. ✅ Iterate for improvement
5. ✅ Save successful prompts

---

**Status**: ✅ Complete Guide
**Last Updated**: December 2024
**Works With**: All 4 generation modes
