"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CONTENTSQUARE_TAG_ID = "e7c1e147d6221";

export default function Contentsquare() {
  const pathname = usePathname();
  const previousPath = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    const pagePath =
      window.location.pathname + window.location.hash.replace("#", "?__");

    window._uxa = window._uxa || [];

    if (previousPath.current === null) {
      window._uxa.push([
        "setPath",
        pagePath,
        { lifespan: "onNextPageviewOnly" },
      ]);

      const tag = document.createElement("script");
      tag.type = "text/javascript";
      tag.async = true;
      tag.src = `https://t.contentsquare.net/uxa/${CONTENTSQUARE_TAG_ID}.js`;
      document.head.appendChild(tag);
    } else if (previousPath.current !== pathname) {
      window._uxa.push(["trackPageview", pagePath]);
    }

    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
