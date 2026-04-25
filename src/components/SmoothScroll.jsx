"use client";

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth <= 1024) return;

    let lenis = null;
    let observer = null;
    let rafId = null;
    let currentWrapper = null;

    const initLenis = () => {
      const wrapper = document.querySelector('.output-section');
      const content = document.querySelector('.output-content');

      if (!wrapper || !content) {
        if (lenis) {
          lenis.destroy();
          lenis = null;
          currentWrapper = null;
          if (rafId) cancelAnimationFrame(rafId);
        }
        return false;
      }

      if (lenis && currentWrapper === wrapper) return true; // Already initialized for this DOM node

      if (lenis) {
        lenis.destroy();
        lenis = null;
        if (rafId) cancelAnimationFrame(rafId);
      }

      currentWrapper = wrapper;

      lenis = new Lenis({
        wrapper: wrapper,
        content: content,
        duration: 1.2,
        lerp: 0.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.2,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      function raf(time) {
        if (lenis) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }
      rafId = requestAnimationFrame(raf);

      return true;
    };

    // Use a persistent observer to handle dashboard switching
    observer = new MutationObserver(() => {
      initLenis();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial attempt
    initLenis();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      if (observer) observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
