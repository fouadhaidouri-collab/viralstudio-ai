import "./globals.css";

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
        <style dangerouslySetInnerHTML={{__html:'*,*::before,*::after{border-width:0;border-style:solid;border-color:currentColor}hr{border-top-width:1px}*{scrollbar-width:thin;scrollbar-color:#222 transparent}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#222;border-radius:10px}'}} />
      </head>
      <body className="h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
