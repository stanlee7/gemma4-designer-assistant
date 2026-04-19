import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Gemma-4-E2B WebLLM Assistant",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Assistant",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "AI Designer Assistant",
    description: "브라우저에서 직접 구동되는 AI 디자이너 어시스턴트",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0061A4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
