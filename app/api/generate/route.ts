import { NextRequest, NextResponse } from "next/server";

const difficultyPrompts = {
  small: "with many small detailed areas and fine intricate patterns to color",
  medium: "with medium-sized areas and moderate detail to color",
  large: "with large simple bold areas and thick outlines, minimal detail, easy for young children",
};

const orientationPrompts = {
  landscape: "in landscape/horizontal orientation (wider than tall)",
  portrait: "in portrait/vertical orientation (taller than wide)",
};

const orientationSizes = {
  landscape: { width: 1024, height: 768 },
  portrait: { width: 768, height: 1024 },
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, orientation, difficulty, uploadedImage } = await req.json();

    if (uploadedImage) {
      // Image-to-coloring-page requires Gemini
      return await generateWithGemini(prompt, orientation, difficulty, uploadedImage);
    }

    // Text-to-coloring-page via Pollinations (free, no API key)
    const fullPrompt = `Black and white coloring page for children showing: ${prompt}. Pure black outlines on completely white background, NO gray shading, NO gradients, NO color fills, thick clear bold outlines suitable for coloring, cute friendly cartoon illustration style for kids aged 3-10, ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}, ${orientationPrompts[orientation as keyof typeof orientationPrompts] || orientationPrompts.landscape}, the image should fill the page and be centered`;

    const size = orientationSizes[orientation as keyof typeof orientationSizes] || orientationSizes.landscape;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${size.width}&height=${size.height}&nologo=true&seed=${Date.now()}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("שגיאה ביצירת התמונה");
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ image: base64 });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה ביצירת התמונה" },
      { status: 500 }
    );
  }
}

async function generateWithGemini(
  prompt: string,
  orientation: string,
  difficulty: string,
  uploadedImage: string
) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    } as any,
  });

  const base64Data = uploadedImage.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = uploadedImage.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const fullPrompt = `Convert this image into a black and white coloring page for children.
Style requirements:
- Pure black outlines on white background only
- No gray shading, no gradients, no fills
- Thick clear bold outlines (3-5px)
- Cartoon/illustration style suitable for kids
- ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}
- ${orientationPrompts[orientation as keyof typeof orientationPrompts] || orientationPrompts.landscape}
- Keep the main subject and composition of the original image
${prompt ? `- Additional instruction: ${prompt}` : ""}`;

  const result = await model.generateContent([
    { text: fullPrompt },
    { inlineData: { mimeType, data: base64Data } },
  ]);

  const candidates = result.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("לא התקבלה תמונה מה-AI");
  }

  let imageData: string | null = null;
  for (const part of candidates[0].content.parts) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      break;
    }
  }

  if (!imageData) {
    throw new Error("לא נמצאה תמונה בתשובה");
  }

  return NextResponse.json({ image: imageData });
}
