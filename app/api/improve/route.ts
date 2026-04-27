import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const difficultyPrompts = {
  small: "with many small detailed areas and fine intricate patterns to color",
  medium: "with medium-sized areas and moderate detail to color",
  large: "with large simple bold areas and thick outlines, minimal detail, easy for young children",
};

export async function POST(req: NextRequest) {
  try {
    const { currentImage, improvePrompt, difficulty } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      } as any,
    });

    const prompt = `This is a black and white coloring page. Please modify it based on this instruction: "${improvePrompt}"

Keep the same coloring page style:
- Pure black outlines on white background only
- No gray shading, no gradients, no color fills
- Thick clear bold outlines suitable for coloring
- Cartoon/illustration style for kids
- ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}
- Preserve the overall composition but apply the requested changes`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/png", data: currentImage } },
    ]);

    const response = result.response;
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
    console.error("Improve error:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בשיפור התמונה" },
      { status: 500 }
    );
  }
}
