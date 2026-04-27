import { NextRequest, NextResponse } from "next/server";

const difficultyPrompts = {
  small: "with many small detailed areas and fine intricate patterns to color",
  medium: "with medium-sized areas and moderate detail to color",
  large: "with large simple bold areas and thick outlines, minimal detail, easy for young children",
};

export async function POST(req: NextRequest) {
  try {
    const { currentImage, improvePrompt, difficulty } = await req.json();

    // Use Pollinations for improve (text-to-image, regenerates based on prompt)
    const fullPrompt = `Black and white coloring page for children: ${improvePrompt}. Pure black outlines on white background only, NO gray shading, NO gradients, NO color fills, thick clear bold outlines suitable for coloring, cartoon illustration style for kids, ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}`;

    const encodedPrompt = encodeURIComponent(fullPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${Date.now()}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("שגיאה בשיפור התמונה");
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ image: base64 });
  } catch (error: any) {
    console.error("Improve error:", error);
    return NextResponse.json(
      { error: error.message || "שגיאה בשיפור התמונה" },
      { status: 500 }
    );
  }
}
