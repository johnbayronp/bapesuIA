// src/components/adsence/AdScriptLoader.jsx
import { useEffect } from "react";

const AdScriptLoader = () => {
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${import.meta.env.VITE_ADSENSE_CLIENT}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

export default AdScriptLoader;
