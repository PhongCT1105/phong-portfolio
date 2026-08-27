import { create } from 'zustand';

export const STATION_IDS = ['phong', 'receipts', 'work', 'road', 'now', 'contact'] as const;
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
  setProgress: (progress: number) => void;
  setRanges: (ranges: number[]) => void;
}

const DEFAULT_RANGES = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1];

export const useJourney = create<JourneyState>((set, get) => ({
  progress: 0,
  station: 0,
  localT: 0,
  ranges: DEFAULT_RANGES,
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
