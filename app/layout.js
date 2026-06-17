import "./globals.css";
import LanguageProvider from "./components/LanguageProvider";

export const metadata = {
  title: "ViralStudio AI | Premium Suite",
  description: "Create Viral Content With AI",
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full overflow-hidden">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
