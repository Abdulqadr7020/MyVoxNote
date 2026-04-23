"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth <= 1024) return;

    let lenis;
    let observer;
    let rafId;

    const initLenis = () => {
      const wrapper = document.querySelector('.output-section');
      const content = document.querySelector('.output-content');

      if (!wrapper || !content) return false;

      lenis = new Lenis({
        wrapper: wrapper,
        content: content,
        duration: 2.2,
        lerp: 0.04,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      function raf(time) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      return true;
    };

    if (!initLenis()) {
      observer = new MutationObserver(() => {
        if (initLenis()) {
          observer.disconnect();
          observer = null;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      if (observer) observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
