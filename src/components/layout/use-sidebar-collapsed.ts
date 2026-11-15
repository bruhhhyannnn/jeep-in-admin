'use client';

import { useEffect, useState } from 'react';
import { useSidebarStore } from '@/store';

const WIDE_QUERY = '(min-width: 1280px)';

/** Icons-only below 1280px wide, unless the user folded or opened it themselves. */
export function useSidebarCollapsed() {
  const collapsedPref = useSidebarStore((s) => s.collapsedPref);
  const [isWide, setIsWide] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const update = () => setIsWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return collapsedPref ?? !isWide;
}
