"use client";

import { useState, useRef, useCallback } from "react";
import type { Orientation, Difficulty } from "@/app/page";

interface InputScreenProps {
  onGenerated: (imageBase64: string) => void;
}

export default function InputScreen({ onGenerated }: InputScreenProps) {
  const [prompt, setPrompt] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("הדפדפן שלך לא תומך בזיהוי קול. נסה Chrome.");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "he-IL";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) {
      setError("אנא הכנס תיאור או העלה תמונה");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, orientation, difficulty, uploadedImage }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה ביצירת התמונה");
      }
      const data = await res.json();
      onGenerated(data.image);
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת התמונה, נסה שוב");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h1 style={{
          fontSize: 34,
          fontWeight: 700,
          margin: "0 0 6px",
          background: "linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          צביעה בכיף
        </h1>
        <p style={{ fontSize: 13, color: "#8B85C1", margin: "0 0 2px" }}>
          דפי צביעה קסומים רק בשבילך!
        </p>
        <span style={{ fontSize: 14, color: "#A09DD6" }}>✦</span>
      </div>

      {/* Card */}
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {/* Text input */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#4A4580", margin: "0 0 10px", textAlign: "center" }}>
            מה נצבע היום?
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="למשל: דינוזאור שמח..."
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: "11px 14px",
                fontSize: 14,
                direction: "rtl",
                borderRadius: 8,
                border: "1px solid #D4D0F0",
                background: "#FAFAFE",
                color: "#333",
              }}
            />
            <button
              onClick={startListening}
              disabled={isGenerating}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: isListening ? "#E0527A" : "#7F77DD",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
              title="דבר עכשיו"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="9" y1="22" x2="15" y2="22" />
              </svg>
            </button>
          </div>
          {isListening && (
            <p style={{ fontSize: 11, color: "#E0527A", textAlign: "center", marginTop: 6 }}>
              🎙️ מאזין...
            </p>
          )}
        </div>

        {/* Image upload */}
        <div style={{
          border: "1.5px dashed #C4C0EC",
          borderRadius: 12,
          padding: 16,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 12, color: "#7F77DD", margin: "0 0 14px", fontWeight: 600 }}>
            או צלמו תמונה והפכו אותה לדף צביעה!
          </p>
          {uploadedImage && (
            <div style={{ marginBottom: 12, position: "relative", display: "inline-block" }}>
              <img src={uploadedImage} alt="תמונה שנבחרה" style={{ maxHeight: 100, borderRadius: 8, border: "1px solid #D4D0F0" }} />
              <button
                onClick={() => setUploadedImage(null)}
                style={{
                  position: "absolute", top: -8, left: -8,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#F44336", border: "none", cursor: "pointer",
                  color: "white", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {/* Upload image */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#7F77DD",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <span style={{ fontSize: 11, color: "#7F77DD" }}>העלאת תמונה</span>
            </div>
            {/* Camera */}
            <div
              onClick={() => cameraInputRef.current?.click()}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#E0527A",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span style={{ fontSize: 11, color: "#E0527A" }}>צילום מצלמה</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: "none" }} />
        </div>

        {/* Orientation */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#4A4580", margin: "0 0 10px", textAlign: "center" }}>
            איך הדף יעמוד?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Landscape */}
            <button
              onClick={() => setOrientation("landscape")}
              style={{
                flex: 1,
                border: orientation === "landscape" ? "2px solid #7F77DD" : "1px solid #D4D0F0",
                borderRadius: 10,
                padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                cursor: "pointer",
                background: orientation === "landscape" ? "#EEEDFE" : "white",
              }}
            >
              <div style={{
                width: 36, height: 28,
                border: `2px solid ${orientation === "landscape" ? "#7F77DD" : "#C4C0EC"}`,
                borderRadius: 3, background: orientation === "landscape" ? "white" : "#F8F8FE",
              }} />
              <span style={{ fontSize: 12, color: orientation === "landscape" ? "#534AB7" : "#8B85C1", fontWeight: orientation === "landscape" ? 600 : 400 }}>
                לרוחב
              </span>
            </button>
            {/* Portrait */}
            <button
              onClick={() => setOrientation("portrait")}
              style={{
                flex: 1,
                border: orientation === "portrait" ? "2px solid #7F77DD" : "1px solid #D4D0F0",
                borderRadius: 10,
                padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                cursor: "pointer",
                background: orientation === "portrait" ? "#EEEDFE" : "white",
              }}
            >
              <div style={{
                width: 28, height: 36,
                border: `2px solid ${orientation === "portrait" ? "#7F77DD" : "#C4C0EC"}`,
                borderRadius: 3, background: orientation === "portrait" ? "white" : "#F8F8FE",
              }} />
              <span style={{ fontSize: 12, color: orientation === "portrait" ? "#534AB7" : "#8B85C1", fontWeight: orientation === "portrait" ? 600 : 400 }}>
                לאורך
              </span>
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#4A4580", margin: "0 0 10px", textAlign: "center" }}>
            מה גודל שטחי הצביעה?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["small", "medium", "large"] as Difficulty[]).map((d) => {
              const labels: Record<Difficulty, { main: string; sub: string }> = {
                small: { main: "קטנים", sub: "קשה" },
                medium: { main: "בינוניים", sub: "רגיל" },
                large: { main: "גדולים", sub: "קל" },
              };
              const selected = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    border: selected ? "2px solid #F0B429" : "1px solid #D4D0F0",
                    borderRadius: 10,
                    padding: "9px 6px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    cursor: "pointer",
                    background: selected ? "#FFFBF0" : "white",
                  }}
                >
                  <span style={{ fontSize: 13, color: selected ? "#B07D10" : "#666", fontWeight: selected ? 600 : 400 }}>
                    {labels[d].main}
                  </span>
                  <span style={{ fontSize: 10, color: selected ? "#C9960A" : "#999" }}>
                    {labels[d].sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: "#E0527A", textAlign: "center", margin: 0 }}>{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            width: "100%",
            padding: 15,
            background: isGenerating
              ? "linear-gradient(135deg, #9B93FF 0%, #C07FD4 100%)"
              : "linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 600,
            cursor: isGenerating ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.3s",
          }}
        >
          {isGenerating ? (
            <>
              <span className="pencil-bounce">✏️</span>
              <span>מצייר<DotsLoader /></span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 20 }}>🎨</span>
              <span>צור</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DotsLoader() {
  const [dots, setDots] = useState("");
  useState(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  });
  return <span style={{ minWidth: 20, display: "inline-block" }}>{dots}</span>;
}
