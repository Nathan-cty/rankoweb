// src/hooks/useLockBodyScroll.js
import { useEffect } from "react";

export default function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return;
    const originalOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.documentElement.style.paddingRight;

    // Optionnel: compense la scrollbar pour éviter le "jump" du layout
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = originalOverflow;
      document.documentElement.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
}
