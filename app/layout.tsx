import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "צביעה בכיף",
  description: "דפי צביעה קסומים רק בשבילך!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
