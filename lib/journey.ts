import { create } from 'zustand';

export const STATION_IDS = ['phong', 'receipts', 'work', 'road', 'now', 'contact'] as const;

/**
 * Road-stop ignition thresholds within station 3 — evenly spread across the
 * (tall) road scroll track so each stop gets viewing time. Shared by the DOM
 * spotlight (Road.tsx) and the 3D gates (city/Gates.tsx); each gate ignites
 * ~one gate-length before the camera reaches it (arrival ≈ 0.27 + i·0.16).
 */
export const ROAD_THRESHOLDS = [0.1, 0.26, 0.42, 0.56, 0.68] as const;
export type StationId = (typeof STATION_IDS)[number];

interface JourneyState {
  /** 0..1 across the whole page scroll */
  progress: number;
  /** 0..5 — index into STATION_IDS */
  station: number;
  /** 0..1 within the current station */
  localT: number;
  /** station start offsets in page-progress space; length = stations + 1, last = 1 */
  ranges: number[];
  /** 0..1 — city power-on driven by the boot sequence (1 = fully lit) */
  boot: number;
  /** which project the work shelf has focused (0..3) — single source of truth */
  workFocus: number;
  /** slug of the opened case study, or null */
  workOpen: string | null;
  /** rendering tier chosen by CityLayer ('off' = 2D fallback page) */
  tier: 'full' | 'lite' | 'off';
  /** receipt card index hovered in the DOM, or null — flares its vault */
  receiptHover: number | null;
  /** which receipt the readout shows — follows vault opens; vault clicks set it */
  receiptFocus: number;
  setProgress: (progress: number) => void;
  setRanges: (ranges: number[]) => void;
  setBoot: (boot: number) => void;
  setWork: (focus: number, open: string | null) => void;
  setTier: (tier: 'full' | 'lite' | 'off') => void;
  setReceiptHover: (index: number | null) => void;
  setReceiptFocus: (index: number) => void;
}

const DEFAULT_RANGES = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1];

export const useJourney = create<JourneyState>((set, get) => ({
  progress: 0,
  station: 0,
  localT: 0,
  ranges: DEFAULT_RANGES,
  boot: 0,
  workFocus: 0,
  workOpen: null,
  tier: 'off',
  receiptHover: null,
  setBoot: (boot) => set({ boot: Math.max(0, Math.min(1, boot)) }),
  setWork: (workFocus, workOpen) => set({ workFocus, workOpen }),
  setTier: (tier) => set({ tier }),
  setReceiptHover: (receiptHover) => set({ receiptHover }),
  receiptFocus: 0,
  setReceiptFocus: (receiptFocus) => set({ receiptFocus }),
  setProgress: (progress) => {
    const p = Math.max(0, Math.min(1, progress));
    const { ranges } = get();
    let station = 0;
    for (let i = 0; i < ranges.length - 1; i += 1) {
      if (p >= ranges[i]) station = i;
    }
    station = Math.min(station, STATION_IDS.length - 1);
    const span = Math.max(1e-4, ranges[station + 1] - ranges[station]);
    const localT = Math.max(0, Math.min(1, (p - ranges[station]) / span));
    set({ progress: p, station, localT });
  },
  setRanges: (ranges) => set({ ranges })
}));

/** Measure the page-progress offset of each station section. */
export function measureStationRanges(): number[] {
  const doc = document.documentElement;
  const total = Math.max(1, doc.scrollHeight - window.innerHeight);
  const ranges = STATION_IDS.map((id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    return Math.max(0, Math.min(1, (el.offsetTop - window.innerHeight * 0.35) / total));
  });
  ranges[0] = 0;
  ranges.push(1);
  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i] < ranges[i - 1]) ranges[i] = ranges[i - 1];
  }
  return ranges;
}
