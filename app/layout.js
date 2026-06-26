import "./globals.css";

export const metadata = {
  title: "MedSync AI — Intelligent Medical Continuity Platform",
  description: "AI-powered medical record management for pregnant women and chronic illness patients. Switch doctors without losing your story.",
  keywords: "medical records, AI health, pregnancy tracker, chronic illness, diet planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
