import { hashString } from '@/shared/utils/format';
import type { EntityId } from '@/shared/types';

// The API has no images, so each event gets a stable gradient + emoji from its id.
// Full class strings so Tailwind can see them at build time.
const GRADIENTS = [
  'from-rose-500 via-fuchsia-500 to-indigo-600',
  'from-amber-400 via-orange-500 to-rose-600',
  'from-emerald-400 via-teal-500 to-sky-600',
  'from-violet-500 via-purple-600 to-slate-900',
  'from-sky-400 via-blue-600 to-indigo-800',
  'from-pink-400 via-rose-500 to-orange-400',
  'from-lime-400 via-emerald-500 to-teal-700',
  'from-slate-700 via-slate-800 to-black',
] as const;

const EMOJIS = ['🎤', '🎸', '🎭', '😂', '🏏', '🎧', '🎻', '🎪', '⚽', '🎹'] as const;

export function posterFor(id: EntityId): { gradient: string; emoji: string } {
  const h = hashString(String(id));
  return {
    gradient: GRADIENTS[h % GRADIENTS.length] ?? GRADIENTS[0],
    emoji: EMOJIS[Math.floor(h / 7) % EMOJIS.length] ?? EMOJIS[0],
  };
}
