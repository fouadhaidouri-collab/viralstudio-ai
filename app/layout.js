import "./globals.css";
import AppInit from "./components/AppInit";

export const metadata = {
  title: "ViralStudio AI | Premium Suite",
  description: "Create Viral Content With AI",
  other: {
    "google": "notranslate",
  },
};

const CRITICAL_CSS = [
  "*,*::before,*::after{border-width:0;border-style:solid;border-color:currentColor}",
  "hr{border-top-width:1px}",
  "*{scrollbar-width:thin;scrollbar-color:#222 transparent}",
  "::-webkit-scrollbar{width:4px}",
  "::-webkit-scrollbar-track{background:transparent}",
  "::-webkit-scrollbar-thumb{background:#222;border-radius:10px}",
  "@keyframes app-bolt-pulse{0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.3),0 0 40px rgba(168,85,247,0.15)}50%{box-shadow:0 0 40px rgba(168,85,247,0.5),0 0 60px rgba(168,85,247,0.25)}}",
  ".app-bolt-icon{animation:app-bolt-pulse 2s ease-in-out infinite}",
  "@keyframes app-dot-pulse{0%,80%,100%{transform:scale(0.6);opacity:0.3}40%{transform:scale(1);opacity:1}}",
  ".app-dot:nth-child(1){animation:app-dot-pulse 1.4s ease-in-out infinite 0s}",
  ".app-dot:nth-child(2){animation:app-dot-pulse 1.4s ease-in-out infinite 0.16s}",
  ".app-dot:nth-child(3){animation:app-dot-pulse 1.4s ease-in-out infinite 0.32s}",
].join("");

export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&display=swap" as="style" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body className="h-full overflow-hidden">
        <AppInit>
          {children}
        </AppInit>
      </body>
    </html>
  );
}
