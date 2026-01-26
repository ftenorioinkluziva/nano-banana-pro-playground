import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { requireAuth } from "@/lib/auth-session";
import { checkCredits, deductCredits } from "@/lib/credits";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const { productName, description, targetAudience, category, ingredients, benefits } = body;

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Check credits (1 credit)
    const cost = 1;
    const hasCredits = await checkCredits(userId, cost);
    if (!hasCredits) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Build context from product information
    const productContext = `
Product Name: ${productName}
${description ? `Description: ${description}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
${category ? `Category: ${category}` : ""}
${ingredients ? `Ingredients: ${ingredients}` : ""}
${benefits ? `Benefits: ${benefits}` : ""}
    `.trim();

    const prompt = `You are an expert UGC (User-Generated Content) video creator and creative director.

Based on the following product information, create a detailed, engaging scene description for a realistic UGC-style video. The video should feel authentic, relatable, and natural - like content created by a real user sharing their genuine experience.

${productContext}

Create a scene description that includes:
1. Setting/Environment (where the scene takes place - home, gym, office, outdoors, etc.)
2. Visual Elements (lighting, mood, props, background)
3. Person/Character (who is in the video and what they're doing)
4. Product Integration (how the product is naturally featured)
5. Tone/Style (casual, energetic, calm, professional, etc.)

The description should be:
- Realistic and achievable for UGC content
- 2-4 sentences long
- Focused on visual elements that work well for video
- Natural and authentic (avoid overly promotional language)
- Specific enough to guide video generation

Generate ONLY the scene description, without any prefixes, explanations, or extra text.`;

    // Using Gemini 2.5 Flash for optimal price-performance and low-latency
    // Context: 1M tokens | Output: 65K tokens
    // Ideal for high-volume, fast text generation tasks
    const { text } = await generateText({
      model: google("gemini-2.5-flash" as any),
      prompt,
      temperature: 0.8,
      maxTokens: 200,
    });

    // Deduct credits
    await deductCredits(userId, cost, "Scene Description Generation");

    return NextResponse.json({
      success: true,
      sceneDescription: text.trim(),
    });

  } catch (error: any) {
    console.error("Error generating scene description:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate scene description" },
      { status: 500 }
    );
  }
}
