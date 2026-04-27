"use client";

import { useState } from "react";
import InputScreen from "@/components/InputScreen";
import ResultScreen from "@/components/ResultScreen";

export type Orientation = "landscape" | "portrait";
export type Difficulty = "small" | "medium" | "large";

export default function Home() {
  const [screen, setScreen] = useState<"input" | "result">("input");
  const [generatedImage, setGeneratedImage] = useState<string>("");

  const handleGenerated = (imageBase64: string) => {
    setGeneratedImage(imageBase64);
    setScreen("result");
  };

  const handleRestart = () => {
    setGeneratedImage("");
    setScreen("input");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#EEF0FB", padding: "16px 0" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>
        {screen === "input" ? (
          <InputScreen onGenerated={handleGenerated} />
        ) : (
          <ResultScreen
            imageBase64={generatedImage}
            onRestart={handleRestart}
            onImproved={handleGenerated}
          />
        )}
      </div>
    </main>
  );
}
