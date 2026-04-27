import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const difficultyPrompts = {
  small: "with many small detailed areas and fine intricate patterns to color",
  medium: "with medium-sized areas and moderate detail to color",
  large: "with large simple bold areas and thick outlines, minimal detail, easy for young children",
};

const orientationPrompts = {
  landscape: "in landscape/horizontal orientation (wider than tall)",
  portrait: "in portrait/vertical orientation (taller than wide)",
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, orientation, difficulty, uploadedImage } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"] as any,
      },
    });

    let fullPrompt: string;
    const parts: any[] = [];

    if (uploadedImage) {
      // Image-to-coloring-page
      const base64Data = uploadedImage.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = uploadedImage.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      fullPrompt = `Convert this image into a black and white coloring page for children.
Style requirements:
- Pure black outlines on white background only
- No gray shading, no gradients, no fills
- Thick clear bold outlines (3-5px)
- Cartoon/illustration style suitable for kids
- ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}
- ${orientationPrompts[orientation as keyof typeof orientationPrompts] || orientationPrompts.landscape}
- Keep the main subject and composition of the original image
${prompt ? `- Additional instruction: ${prompt}` : ""}`;

      parts.push({ text: fullPrompt });
      parts.push({ inlineData: { mimeType, data: base64Data } });
    } else {
      // Text-to-coloring-page
      fullPrompt = `Create a black and white coloring page for children showing: ${prompt}

Style requirements:
- Pure black outlines on completely white background
- NO gray shading, NO gradients, NO color fills whatsoever
- Thick clear bold outlines suitable for coloring
- Cute friendly cartoon/illustration style for kids aged 3-10
- ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}
- ${orientationPrompts[orientation as keyof typeof orientationPrompts] || orientationPrompts.landscape}
- The image should fill the page and be centered
- Add fun decorative elements like stars, hearts, or flowers if space allows`;

      parts.push({ text: fullPrompt });
    }

    const result = await model.generateContent(parts);
    const response = result.response;

    // Extract image from response
    const candidates = response.candidates;
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
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה ביצירת התמונה" },
      { status: 500 }
    );
  }
}
