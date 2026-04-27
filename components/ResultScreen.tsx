"use client";

import { useState, useRef, useCallback } from "react";
import type { Difficulty } from "@/app/page";

interface ResultScreenProps {
  imageBase64: string;
  onRestart: () => void;
  onImproved: (imageBase64: string) => void;
}

export default function ResultScreen({ imageBase64, onRestart, onImproved }: ResultScreenProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [improvePrompt, setImprovePrompt] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isImproving, setIsImproving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>צביעה בכיף</title>
        <style>body{margin:0;display:flex;justify-content:center;} img{max-width:100%;}</style>
        </head>
        <body onload="window.print()">
          <img src="data:image/png;base64,${imageBase64}" />
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleSave = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = "דף-צביעה.png";
    link.click();
  };

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
      setImprovePrompt(event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  }, []);

  const handleImprove = async () => {
    if (!improvePrompt.trim()) {
      setError("אנא תאר מה לשפר");
      return;
    }
    setError(null);
    setIsImproving(true);
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentImage: imageBase64, improvePrompt, difficulty }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "שגיאה בשיפור התמונה");
      }
      const data = await res.json();
      setImprovePrompt("");
      onImproved(data.image);
    } catch (err: any) {
      setError(err.message || "שגיאה בשיפור התמונה");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 12, paddingTop: 4 }}>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 2px",
          background: "linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          צביעה בכיף
        </h1>
        <p style={{ fontSize: 11, color: "#8B85C1", margin: 0 }}>דפי צביעה קסומים רק בשבילך! ✦</p>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        {/* Left: Save + Print */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleSave}
            style={{
              padding: "7px 12px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            שמור
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: "7px 12px",
              background: "#534AB7",
              color: "white",
              border: "none",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            הדפס
          </button>
        </div>

        {/* Right: Restart */}
        <button
          onClick={onRestart}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#7F77DD",
            fontSize: 12,
            fontWeight: 600,
            direction: "ltr",
          }}
        >
          להתחיל מחדש
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Image + floating panel */}
      <div style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #D4D0F0",
        height: "calc(100vh - 180px)",
        minHeight: 400,
      }}>
        {/* Scrollable image */}
        <div style={{
          height: "100%",
          overflowY: "scroll",
          background: "white",
          paddingBottom: isPanelOpen ? 180 : 60,
          boxSizing: "border-box",
        }}>
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt="דף צביעה"
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Floating panel */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.97)",
          borderTop: "1px solid #E0DCF8",
          borderRadius: "14px 14px 0 0",
          boxShadow: "0 -3px 16px rgba(100,90,200,0.10)",
        }}>
          {/* Handle + toggle */}
          <div
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0 4px", cursor: "pointer" }}
          >
            <div style={{ width: 36, height: 4, background: "#D4D0F0", borderRadius: 2 }} />
          </div>

          <div
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 8px", cursor: "pointer" }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#F44336",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4A4580", margin: 0, flex: 1, textAlign: "center" }}>
              רוצים לשפר משהו?
            </p>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#EEEDFE",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: isPanelOpen ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.25s ease",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
          </div>

          {/* Panel content */}
          <div style={{
            overflow: "hidden",
            maxHeight: isPanelOpen ? 200 : 0,
            opacity: isPanelOpen ? 1 : 0,
            transition: "max-height 0.25s ease, opacity 0.2s ease",
            padding: isPanelOpen ? "0 14px 14px" : "0 14px",
          }}>
            {/* Difficulty */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
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
                    onClick={(e) => { e.stopPropagation(); setDifficulty(d); }}
                    style={{
                      flex: 1,
                      border: selected ? "2px solid #F0B429" : "1px solid #D4D0F0",
                      borderRadius: 8,
                      padding: "7px 4px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: selected ? "#FFFBF0" : "white",
                    }}
                  >
                    <div style={{ fontSize: 11, color: selected ? "#B07D10" : "#666", fontWeight: selected ? 600 : 400 }}>
                      {labels[d].main}
                    </div>
                    <div style={{ fontSize: 9, color: selected ? "#C9960A" : "#999" }}>
                      {labels[d].sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Improve input */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <input
                type="text"
                value={improvePrompt}
                onChange={(e) => setImprovePrompt(e.target.value)}
                placeholder="למשל: הוסף כוכבים ברקע..."
                disabled={isImproving}
                onKeyDown={(e) => e.key === "Enter" && handleImprove()}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  fontSize: 12,
                  direction: "rtl",
                  borderRadius: 8,
                  border: "1px solid #D4D0F0",
                  background: "#FAFAFE",
                }}
              />
              <button
                onClick={startListening}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: isListening ? "#E0527A" : "#7F77DD",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="9" y1="22" x2="15" y2="22" />
                </svg>
              </button>
              <button
                onClick={handleImprove}
                disabled={isImproving}
                style={{
                  padding: "8px 14px",
                  background: isImproving ? "#9B93FF" : "#534AB7",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isImproving ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {isImproving ? "משפר..." : "שפר"}
              </button>
            </div>
            {error && <p style={{ fontSize: 11, color: "#E0527A", margin: "6px 0 0", textAlign: "center" }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
