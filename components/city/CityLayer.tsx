'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import NetworkCanvas from '@/components/NetworkCanvas';
import { useJourney } from '@/lib/journey';

const CityScene = dynamic(() => import('@/components/city/CityScene'), { ssr: false });

export type QualityTier = 'full' | 'lite' | 'off';

function detectTier(): QualityTier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return 'off';
  } catch {
    return 'off';
  }
  if (window.innerWidth < 768) return 'off';
  if (window.innerWidth < 1200 || (navigator.hardwareConcurrency ?? 8) <= 4) return 'lite';
  return 'full';
}

export default function CityLayer() {
  const [tier, setTier] = useState<QualityTier | null>(null);

  useEffect(() => {
    const detected = detectTier();
    setTier(detected);
    useJourney.getState().setTier(detected);
  }, []);

  if (tier === null) return null;
  if (tier === 'off') return <NetworkCanvas />;
  return (
    <div className="city-layer" aria-hidden="true">
      <CityScene tier={tier} />
    </div>
  );
}
