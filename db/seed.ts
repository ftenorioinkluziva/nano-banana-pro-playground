import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"
import { capabilities, brands, products, systemSettings } from "./schema"
import "dotenv/config"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const capabilitiesData = [
  {
    id: "influencer_testimonial",
    label: "Depoimento Selfie (Influencer)",
    description:
      "Um criador de conteúdo falando diretamente para a câmera, segurando o produto.",
    iconName: "user-circle",
    basePromptTemplate: `Subject: A realistic influencer (specify age/gender based on input) holding the product directly to the camera.
Action: Speaking enthusiastically, energetic facial expressions, slight hand movements tailored for vertical viewing.
Camera: Front-facing smartphone camera angle, slightly wide lens, close-up.
Lighting: Ring light reflection in eyes, soft indoor lighting, bedroom or living room background.
Style: UGC, TikTok viral aesthetic, amateur but high quality, raw footage, 4k.`,
    recommendedAspectRatio: "9:16" as const,
    defaultNegativePrompt:
      "cartoon, illustration, 3d render, professional studio, ugly, deformed",
    generationType: "TEXT_2_VIDEO" as const,
    isActive: true,
  },
  {
    id: "product_cinematic_reveal",
    label: "Reveal Cinematográfico de Produto",
    description:
      "Foco total no produto com iluminação dramática e movimento lento.",
    iconName: "film",
    basePromptTemplate: `Subject: The product centered in the frame.
Action: Slow motion camera rotation around the product (orbital shot).
Camera: Macro lens, shallow depth of field (bokeh background).
Lighting: Dramatic studio lighting, rim light highlighting edges, moody atmosphere.
Style: High-end commercial, TV advertisement quality, sharp focus, 8k.`,
    recommendedAspectRatio: "16:9" as const,
    defaultNegativePrompt:
      "hands, face, people, text, overlay, low quality, blurry",
    generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO" as const,
    isActive: true,
  },
  {
    id: "lifestyle_usage",
    label: "Uso Lifestyle (Dia a Dia)",
    description: "Alguém usando o produto em um ambiente natural.",
    iconName: "coffee",
    basePromptTemplate: `Subject: A person using the product in a natural environment (e.g., gym, kitchen, street).
Action: Natural interaction with the product, showing the benefit/result.
Camera: Medium shot, handheld camera movement (slight shake for realism).
Lighting: Natural sunlight, golden hour or bright daylight.
Style: Authentic vlog style, candid moment, unscripted feel.`,
    recommendedAspectRatio: "9:16" as const,
    defaultNegativePrompt:
      "cartoon, illustration, 3d render, professional studio, ugly, deformed",
    generationType: "TEXT_2_VIDEO" as const,
    isActive: true,
  },
  {
    id: "ugc-selfie-v1",
    label: "UGC Selfie Hiper-Realista",
    description:
      "Selfie ultra-realista com especificações técnicas de câmera para máxima autenticidade.",
    iconName: "smartphone",
    basePromptTemplate: `Subject: A hyper-realistic person (age 25-35, gender based on target audience) holding their phone with one hand, taking a selfie while holding the product in the other hand close to their face.
Action: Smiling naturally, slight head tilt, eyes looking directly at the front camera with authentic expression, subtle hand movement showing the product.
Camera: Front-facing smartphone camera (iPhone 15 Pro Max equivalent), 12MP sensor, f/1.9 aperture, 23mm focal length (ultra-wide selfie mode), autofocus on face.
Composition: Tight framing, subject occupies 70% of frame, product visible but not dominating, slight Dutch angle (5-10 degrees) for casual feel.
Lighting: Soft natural window light from the left (simulating golden hour), slight ring light reflection in the eyes (circular catchlight), warm color temperature (3500K), high dynamic range.
Environment: Modern bedroom or bathroom background (slightly blurred, bokeh effect), depth of field f/2.8, background 80% out of focus.
Technical specs: Shot in ProRes 4K 60fps, color graded for Instagram/TikTok (boosted saturation +15%, contrast +10%), film grain overlay at 5% opacity for organic feel.
Style: UGC authentic, amateur but polished, vertical 9:16 format, raw unscripted vibe, trending on TikTok 2024.`,
    recommendedAspectRatio: "9:16" as const,
    defaultNegativePrompt:
      "cartoon, illustration, 3d render, tripod, professional studio lighting, ugly, deformed",
    generationType: "TEXT_2_VIDEO" as const,
    isActive: true,
  },
  {
    id: "cinematic-reveal-v1",
    label: "Reveal Cinematográfico com Partículas",
    description:
      "Apresentação dramática do produto com efeitos visuais e partículas flutuantes.",
    iconName: "sparkles",
    basePromptTemplate: `Subject: The product centered in frame, pristine and perfectly lit, emerging from darkness.
Action: Slow 360-degree orbital camera movement (2 rotations in 6 seconds), product slowly rotating counter-clockwise, floating particles of light (bokeh) drifting upward around the product.
Camera: Phantom Flex 4K high-speed camera, macro lens 100mm f/2.8, shallow depth of field (f/2.8), locked focus on product, smooth gimbal movement.
Composition: Rule of thirds, product occupies center third, negative space with gradient background, subtle vignette effect.
Lighting: Three-point lighting setup (key light: soft box 45° angle, fill light: 25% intensity opposite side, rim light: strong backlight creating edge glow), dramatic shadows, moody atmosphere.
Environment: Seamless black gradient background (fading from charcoal to pure black), floating light particles (simulating dust in spotlight), volumetric fog subtle at 15% opacity.
Visual effects: Light rays (god rays) coming from top-right at 30° angle, subtle lens flare, color grading with teal shadows and orange highlights (cinema LUT), bloom effect on highlights.
Technical specs: Shot in 8K RAW 120fps (played back at 24fps for 5x slow motion), color depth 12-bit, HDR grading, Blackmagic color science.
Style: High-end commercial, Apple product reveal aesthetic, luxury brand advertising, film noir influence.`,
    recommendedAspectRatio: "16:9" as const,
    defaultNegativePrompt:
      "hands, face, people, text, overlay, low quality, blurry",
    generationType: "FIRST_AND_LAST_FRAMES_2_VIDEO" as const,
    isActive: true,
  },
]

const brandsData = [
  {
    name: "Green Line Premium",
    tone: "energetic",
    description:
      "E-commerce de suplementos nutricionais e produtos de bem-estar com foco em saúde acessível. Oferece produtos para emagrecimento, vitaminas, cuidados femininos, sono, treino e articulações com mensagens motivacionais e inclusivas.",
  },
  {
    name: "VitaPlus Naturals",
    tone: "calm",
    description:
      "Marca focada em suplementos naturais e orgânicos de alta qualidade. Produtos veganos, sem glúten e com ingredientes de origem controlada para um estilo de vida saudável e consciente.",
  },
]

const productsData: Record<string, Array<{
  name: string
  slug: string
  price: string
  category: string
  format: string
  quantityLabel: string
  description: string
  usageInstructions: string
  benefits: string[]
  targetAudience: string
  imageUrl: string
}>> = {
  "Green Line Premium": [
    {
      name: "Termogênico Ultra Burn",
      slug: "termogenico-ultra-burn",
      price: "89.90",
      category: "Emagrecimento",
      format: "Cápsulas",
      quantityLabel: "60 cápsulas",
      description: "Termogênico potente com cafeína, chá verde e pimenta para acelerar o metabolismo e queimar gordura de forma eficiente.",
      usageInstructions: "Tomar 2 cápsulas ao dia, preferencialmente antes do treino ou pela manhã.",
      benefits: ["Acelera o metabolismo", "Aumenta a queima de gordura", "Fornece energia para o treino", "Reduz o apetite"],
      targetAudience: "Adultos que buscam emagrecimento e definição muscular",
      imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop",
    },
    {
      name: "Colágeno Hidrolisado Premium",
      slug: "colageno-hidrolisado-premium",
      price: "79.90",
      category: "Beleza",
      format: "Pó",
      quantityLabel: "300g",
      description: "Colágeno hidrolisado tipo I e III com vitamina C para pele, cabelos, unhas e articulações mais saudáveis.",
      usageInstructions: "Diluir 10g (1 colher de sopa) em 200ml de água ou suco. Tomar 1 vez ao dia.",
      benefits: ["Melhora a elasticidade da pele", "Fortalece cabelos e unhas", "Protege as articulações", "Ação antioxidante"],
      targetAudience: "Mulheres acima de 25 anos preocupadas com beleza e bem-estar",
      imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
    },
    {
      name: "Whey Protein Concentrado",
      slug: "whey-protein-concentrado",
      price: "149.90",
      category: "Treino",
      format: "Pó",
      quantityLabel: "900g",
      description: "Proteína do soro do leite de alta qualidade para ganho de massa muscular e recuperação pós-treino.",
      usageInstructions: "Misturar 30g (1 scoop) em 200ml de água ou leite. Tomar após o treino.",
      benefits: ["Alto teor de proteína", "Rápida absorção", "Auxilia na recuperação muscular", "Baixo teor de gordura"],
      targetAudience: "Praticantes de musculação e exercícios físicos",
      imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop",
    },
    {
      name: "Melatonina Sleep Plus",
      slug: "melatonina-sleep-plus",
      price: "49.90",
      category: "Sono",
      format: "Gotas",
      quantityLabel: "30ml",
      description: "Melatonina líquida com passiflora e valeriana para um sono mais profundo e reparador.",
      usageInstructions: "Pingar 20 gotas embaixo da língua 30 minutos antes de dormir.",
      benefits: ["Induz o sono natural", "Melhora a qualidade do sono", "Reduz a ansiedade", "Não causa dependência"],
      targetAudience: "Adultos com dificuldades para dormir ou jet lag",
      imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop",
    },
    {
      name: "Multivitamínico Completo",
      slug: "multivitaminico-completo",
      price: "59.90",
      category: "Vitaminas",
      format: "Cápsulas",
      quantityLabel: "90 cápsulas",
      description: "Complexo vitamínico com 23 vitaminas e minerais essenciais para o funcionamento ideal do organismo.",
      usageInstructions: "Tomar 1 cápsula ao dia, preferencialmente com uma refeição.",
      benefits: ["Fortalece a imunidade", "Aumenta a disposição", "Combate o estresse oxidativo", "Supre deficiências nutricionais"],
      targetAudience: "Adultos que buscam suplementação vitamínica diária",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
    },
  ],
  "VitaPlus Naturals": [
    {
      name: "Ômega 3 Vegano DHA",
      slug: "omega-3-vegano-dha",
      price: "119.90",
      category: "Saúde Cardiovascular",
      format: "Cápsulas",
      quantityLabel: "60 cápsulas",
      description: "Ômega 3 de origem vegetal extraído de algas marinhas, rico em DHA para saúde cerebral e cardiovascular.",
      usageInstructions: "Tomar 2 cápsulas ao dia com uma refeição.",
      benefits: ["Saúde do coração", "Função cerebral", "Anti-inflamatório natural", "100% vegano"],
      targetAudience: "Veganos e vegetarianos que buscam suplementação de ômega 3",
      imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400&h=400&fit=crop",
    },
    {
      name: "Spirulina Orgânica",
      slug: "spirulina-organica",
      price: "69.90",
      category: "Superalimentos",
      format: "Comprimidos",
      quantityLabel: "120 comprimidos",
      description: "Spirulina 100% orgânica e pura, superalimento rico em proteínas, vitaminas e minerais.",
      usageInstructions: "Tomar 4 comprimidos ao dia, preferencialmente antes das refeições.",
      benefits: ["Alta concentração de proteínas", "Desintoxicação natural", "Rico em ferro", "Energia sustentável"],
      targetAudience: "Pessoas que buscam alimentação natural e detox",
      imageUrl: "https://images.unsplash.com/photo-1622766815178-641bef2b4630?w=400&h=400&fit=crop",
    },
    {
      name: "Vitamina D3 + K2",
      slug: "vitamina-d3-k2",
      price: "89.90",
      category: "Vitaminas",
      format: "Gotas",
      quantityLabel: "30ml",
      description: "Combinação sinérgica de vitamina D3 e K2 para saúde óssea e absorção ideal de cálcio.",
      usageInstructions: "Pingar 2 gotas ao dia diretamente na boca ou em alimentos.",
      benefits: ["Fortalece os ossos", "Melhora a imunidade", "Direciona cálcio para os ossos", "Alta biodisponibilidade"],
      targetAudience: "Adultos e idosos preocupados com saúde óssea",
      imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop",
    },
    {
      name: "Ashwagandha Adaptógeno",
      slug: "ashwagandha-adaptogeno",
      price: "79.90",
      category: "Bem-estar",
      format: "Cápsulas",
      quantityLabel: "60 cápsulas",
      description: "Extrato padronizado de Ashwagandha KSM-66, adaptógeno natural para redução do estresse e ansiedade.",
      usageInstructions: "Tomar 1 cápsula ao dia, preferencialmente à noite.",
      benefits: ["Reduz cortisol", "Combate a ansiedade", "Melhora o sono", "Aumenta a energia"],
      targetAudience: "Pessoas com estresse crônico ou ansiedade",
      imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=400&fit=crop",
    },
    {
      name: "Probiótico 10 Bilhões",
      slug: "probiotico-10-bilhoes",
      price: "99.90",
      category: "Saúde Intestinal",
      format: "Cápsulas",
      quantityLabel: "30 cápsulas",
      description: "Blend de 10 cepas probióticas com 10 bilhões de UFC para equilíbrio da flora intestinal.",
      usageInstructions: "Tomar 1 cápsula ao dia em jejum com um copo de água.",
      benefits: ["Equilibra a flora intestinal", "Fortalece a imunidade", "Melhora a digestão", "Reduz inchaço"],
      targetAudience: "Pessoas com problemas digestivos ou que buscam saúde intestinal",
      imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop",
    },
  ],
}

async function seed() {
  console.log("🌱 Seeding database...")

  console.log("  → Inserting capabilities...")
  for (const cap of capabilitiesData) {
    await db
      .insert(capabilities)
      .values(cap)
      .onConflictDoUpdate({
        target: capabilities.id,
        set: {
          label: cap.label,
          description: cap.description,
          basePromptTemplate: cap.basePromptTemplate,
          generationType: cap.generationType,
          updatedAt: new Date(),
        },
      })
  }
  console.log(`  ✓ ${capabilitiesData.length} capabilities inserted`)

  console.log("  → Inserting brands...")
  for (const brand of brandsData) {
    await db
      .insert(brands)
      .values(brand)
      .onConflictDoUpdate({
        target: brands.name,
        set: {
          tone: brand.tone,
          description: brand.description,
          updatedAt: new Date(),
        },
      })
  }
  console.log(`  ✓ ${brandsData.length} brands inserted`)

  console.log("  → Inserting products...")
  let productCount = 0
  for (const brandName of Object.keys(productsData)) {
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.name, brandName))
      .limit(1)

    if (!brand) {
      console.warn(`  ⚠ Brand "${brandName}" not found, skipping products`)
      continue
    }

    for (const product of productsData[brandName]) {
      await db
        .insert(products)
        .values({
          brandId: brand.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          category: product.category,
          format: product.format,
          quantityLabel: product.quantityLabel,
          description: product.description,
          usageInstructions: product.usageInstructions,
          benefits: product.benefits,
          targetAudience: product.targetAudience,
          imageUrl: product.imageUrl,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: product.name,
            brandId: brand.id,
            price: product.price,
            category: product.category,
            format: product.format,
            quantityLabel: product.quantityLabel,
            description: product.description,
            usageInstructions: product.usageInstructions,
            benefits: product.benefits,
            targetAudience: product.targetAudience,
            imageUrl: product.imageUrl,
            updatedAt: new Date(),
          },
        })
      productCount++
    }
  }
  console.log(`  ✓ ${productCount} products inserted`)

  console.log(`  ✓ ${productCount} products inserted`)

  console.log("  → Inserting system settings...")

  const DEFAULT_USAGE_COSTS = {
    VIDEO: {
      DEFAULT: 50,
      MODELS: {
        "wan-2-6": 100,
        "sora-2-pro": 100,
        "veo": 50,
        "veo-fast": 50,
        "veo3": 60,
        "veo3_fast": 40,
      }
    },
    IMAGE: {
      DEFAULT: 5,
      MODELS: {
        "nano-banana-pro": 5,
        "z-image": 5,
      }
    },
    PROMPT_ENHANCEMENT: 1
  }

  await db.insert(systemSettings).values({
    key: 'usage_costs',
    value: DEFAULT_USAGE_COSTS,
    description: 'Configuration for usage costs in credits'
  }).onConflictDoUpdate({
    target: systemSettings.key,
    set: {
      value: DEFAULT_USAGE_COSTS,
      updatedAt: new Date()
    }
  })
  console.log("  ✓ System settings checked/inserted")

  console.log("✅ Seed completed!")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
