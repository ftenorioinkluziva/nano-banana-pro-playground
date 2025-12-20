export interface Capability {
  id: string;
  name: string;
  description: string;
  mode: 'text_to_video' | 'image_to_video'; // Decide qual endpoint da Kie usar
  base_prompt_template: string; // O segredo do seu SaaS
  recommended_aspect_ratio: string;
}

export const UGC_CAPABILITIES: Capability[] = [
  {
    id: 'influencer_testimonial',
    name: 'Depoimento Selfie (Influencer)',
    description: 'Um criador de conteúdo falando diretamente para a câmera, segurando o produto.',
    mode: 'text_to_video',
    recommended_aspect_ratio: '9:16',
    base_prompt_template: `
      Subject: A realistic influencer (specify age/gender based on input) holding the product directly to the camera.
      Action: Speaking enthusiastically, energetic facial expressions, slight hand movements tailored for vertical viewing.
      Camera: Front-facing smartphone camera angle, slightly wide lens, close-up.
      Lighting: Ring light reflection in eyes, soft indoor lighting, bedroom or living room background.
      Style: UGC, TikTok viral aesthetic, amateur but high quality, raw footage, 4k.
    `
  },
  {
    id: 'product_cinematic_reveal',
    name: 'Reveal Cinematográfico de Produto',
    description: 'Foco total no produto com iluminação dramática e movimento lento.',
    mode: 'image_to_video', // Idealmente usa a foto do produto cadastrada
    recommended_aspect_ratio: '16:9',
    base_prompt_template: `
      Subject: The product centered in the frame.
      Action: Slow motion camera rotation around the product (orbital shot).
      Camera: Macro lens, shallow depth of field (bokeh background).
      Lighting: Dramatic studio lighting, rim light highlighting edges, moody atmosphere.
      Style: High-end commercial, TV advertisement quality, sharp focus, 8k.
    `
  },
  {
    id: 'lifestyle_usage',
    name: 'Uso Lifestyle (Dia a Dia)',
    description: 'Alguém usando o produto em um ambiente natural.',
    mode: 'text_to_video',
    recommended_aspect_ratio: '9:16',
    base_prompt_template: `
      Subject: A person using the product in a natural environment (e.g., gym, kitchen, street).
      Action: Natural interaction with the product, showing the benefit/result.
      Camera: Medium shot, handheld camera movement (slight shake for realism).
      Lighting: Natural sunlight, golden hour or bright daylight.
      Style: Authentic vlog style, candid moment, unscripted feel.
    `
  }
];