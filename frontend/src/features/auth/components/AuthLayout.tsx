import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/Logo';

const floating = [
  { emoji: '🎤', cls: 'right-[14%] top-[12%] text-6xl', r: '-8deg', delay: '0s' },
  { emoji: '🎭', cls: 'right-[34%] top-[34%] text-4xl', r: '6deg', delay: '-1.2s' },
  { emoji: '🏏', cls: 'right-[10%] top-[56%] text-5xl', r: '-4deg', delay: '-2.4s' },
  { emoji: '🎸', cls: 'left-[10%] bottom-[10%] text-6xl', r: '8deg', delay: '-3.6s' },
  { emoji: '🎟️', cls: 'right-[26%] bottom-[14%] text-5xl', r: '-10deg', delay: '-4.8s' },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-rose-600 to-fuchsia-700 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <Logo inverted className="relative text-3xl" />
        <h1 className="relative mt-10 text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
          Live shows.<br />Real seats.<br />Zero queues.
        </h1>
        <p className="relative mt-5 max-w-md text-lg text-white/85">
          Concerts, comedy, theatre and sports. Pick your exact seat and lock it for 5 minutes while you check out.
        </p>
        {floating.map((f) => (
          <span
            key={f.emoji}
            aria-hidden
            className={`absolute drop-shadow-xl ${f.cls}`}
            style={{ animation: `float 6s ease-in-out ${f.delay} infinite`, ['--r' as string]: f.r }}
          >
            {f.emoji}
          </span>
        ))}
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Logo className="mb-8 text-2xl lg:hidden" />
          <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
