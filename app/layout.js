import "./globals.css";
import { AuthProvider } from "./lib/AuthContext";
import SiteLoader from "./components/SiteLoader";

const criticalStyles = `
*,*::before,*::after{border-width:0;border-style:solid;border-color:currentColor}
hr{border-top-width:1px}
#site-initial-loader{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 45%,rgba(168,85,247,.055),transparent 42%),#030303;opacity:1;transition:opacity .35s cubic-bezier(.4,0,.2,1);font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#fff}
#site-initial-loader[data-leaving="true"]{opacity:0;pointer-events:none}
#site-initial-loader,#site-initial-loader *{box-sizing:border-box}
@media (prefers-reduced-motion:reduce){#site-initial-loader{transition:none}}
`;

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></noscript>
        <style>{criticalStyles}</style>
        <noscript>
          <style>{`#site-initial-loader{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="h-full">
        <AuthProvider>
          <SiteLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
