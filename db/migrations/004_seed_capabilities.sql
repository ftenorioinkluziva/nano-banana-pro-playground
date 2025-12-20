-- Seed capabilities table with initial data
-- Migração dos 3 capabilities hardcoded + 2 novos do guia

INSERT INTO capabilities (id, label, description, icon_name, base_prompt_template, recommended_aspect_ratio, default_negative_prompt, model_mode, is_active)
VALUES
  -- 1. Capability existente: influencer_testimonial
  (
    'influencer_testimonial',
    'Depoimento Selfie (Influencer)',
    'Um criador de conteúdo falando diretamente para a câmera, segurando o produto.',
    'user-circle',
    'Subject: A realistic influencer (specify age/gender based on input) holding the product directly to the camera.
Action: Speaking enthusiastically, energetic facial expressions, slight hand movements tailored for vertical viewing.
Camera: Front-facing smartphone camera angle, slightly wide lens, close-up.
Lighting: Ring light reflection in eyes, soft indoor lighting, bedroom or living room background.
Style: UGC, TikTok viral aesthetic, amateur but high quality, raw footage, 4k.',
    '9:16',
    'cartoon, illustration, 3d render, professional studio, ugly, deformed',
    'text_to_video',
    true
  ),

  -- 2. Capability existente: product_cinematic_reveal
  (
    'product_cinematic_reveal',
    'Reveal Cinematográfico de Produto',
    'Foco total no produto com iluminação dramática e movimento lento.',
    'film',
    'Subject: The product centered in the frame.
Action: Slow motion camera rotation around the product (orbital shot).
Camera: Macro lens, shallow depth of field (bokeh background).
Lighting: Dramatic studio lighting, rim light highlighting edges, moody atmosphere.
Style: High-end commercial, TV advertisement quality, sharp focus, 8k.',
    '16:9',
    'hands, face, people, text, overlay, low quality, blurry',
    'image_to_video',
    true
  ),

  -- 3. Capability existente: lifestyle_usage
  (
    'lifestyle_usage',
    'Uso Lifestyle (Dia a Dia)',
    'Alguém usando o produto em um ambiente natural.',
    'coffee',
    'Subject: A person using the product in a natural environment (e.g., gym, kitchen, street).
Action: Natural interaction with the product, showing the benefit/result.
Camera: Medium shot, handheld camera movement (slight shake for realism).
Lighting: Natural sunlight, golden hour or bright daylight.
Style: Authentic vlog style, candid moment, unscripted feel.',
    '9:16',
    'cartoon, illustration, 3d render, professional studio, ugly, deformed',
    'text_to_video',
    true
  ),

  -- 4. Nova capability do guia: ugc-selfie-v1
  (
    'ugc-selfie-v1',
    'UGC Selfie Hiper-Realista',
    'Selfie ultra-realista com especificações técnicas de câmera para máxima autenticidade.',
    'smartphone',
    'Subject: A hyper-realistic person (age 25-35, gender based on target audience) holding their phone with one hand, taking a selfie while holding the product in the other hand close to their face.
Action: Smiling naturally, slight head tilt, eyes looking directly at the front camera with authentic expression, subtle hand movement showing the product.
Camera: Front-facing smartphone camera (iPhone 15 Pro Max equivalent), 12MP sensor, f/1.9 aperture, 23mm focal length (ultra-wide selfie mode), autofocus on face.
Composition: Tight framing, subject occupies 70% of frame, product visible but not dominating, slight Dutch angle (5-10 degrees) for casual feel.
Lighting: Soft natural window light from the left (simulating golden hour), slight ring light reflection in the eyes (circular catchlight), warm color temperature (3500K), high dynamic range.
Environment: Modern bedroom or bathroom background (slightly blurred, bokeh effect), depth of field f/2.8, background 80% out of focus.
Technical specs: Shot in ProRes 4K 60fps, color graded for Instagram/TikTok (boosted saturation +15%, contrast +10%), film grain overlay at 5% opacity for organic feel.
Style: UGC authentic, amateur but polished, vertical 9:16 format, raw unscripted vibe, trending on TikTok 2024.',
    '9:16',
    'cartoon, illustration, 3d render, tripod, professional studio lighting, ugly, deformed',
    'text_to_video',
    true
  ),

  -- 5. Nova capability do guia: cinematic-reveal-v1
  (
    'cinematic-reveal-v1',
    'Reveal Cinematográfico com Partículas',
    'Apresentação dramática do produto com efeitos visuais e partículas flutuantes.',
    'sparkles',
    'Subject: The product centered in frame, pristine and perfectly lit, emerging from darkness.
Action: Slow 360-degree orbital camera movement (2 rotations in 6 seconds), product slowly rotating counter-clockwise, floating particles of light (bokeh) drifting upward around the product.
Camera: Phantom Flex 4K high-speed camera, macro lens 100mm f/2.8, shallow depth of field (f/2.8), locked focus on product, smooth gimbal movement.
Composition: Rule of thirds, product occupies center third, negative space with gradient background, subtle vignette effect.
Lighting: Three-point lighting setup (key light: soft box 45° angle, fill light: 25% intensity opposite side, rim light: strong backlight creating edge glow), dramatic shadows, moody atmosphere.
Environment: Seamless black gradient background (fading from charcoal to pure black), floating light particles (simulating dust in spotlight), volumetric fog subtle at 15% opacity.
Visual effects: Light rays (god rays) coming from top-right at 30° angle, subtle lens flare, color grading with teal shadows and orange highlights (cinema LUT), bloom effect on highlights.
Technical specs: Shot in 8K RAW 120fps (played back at 24fps for 5x slow motion), color depth 12-bit, HDR grading, Blackmagic color science.
Style: High-end commercial, Apple product reveal aesthetic, luxury brand advertising, film noir influence.',
    '16:9',
    'hands, face, people, text, overlay, low quality, blurry',
    'image_to_video',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE capabilities IS 'Capabilities seeded with 3 existing + 2 new from implementation guide';
