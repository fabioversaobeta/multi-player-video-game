import { useEffect, useState } from 'react';

export interface Viewport { w: number; h: number }

export function useViewport(): Viewport {
  const [v, setV] = useState({ w: innerWidth, h: innerHeight });
  useEffect(() => {
    const on = () => setV({ w: innerWidth, h: innerHeight });
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return v;
}
