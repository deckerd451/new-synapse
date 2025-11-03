/* -----------------------------------------------------------
   Fonts & Tailwind
----------------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* -----------------------------------------------------------
   Design Tokens (CSS Variables)
   - Light/Dark HSL tokens aligned to Tailwind semantic colors
   - Accent = Cyan, Primary = Gold
----------------------------------------------------------- */
@layer base {
  :root {
    /* Surfaces */
    --background: 0 0% 100%;
    --foreground: 0 0% 4%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 4%;

    /* Brand */
    --primary: 51 100% 50%;  /* Gold */
    --primary-foreground: 240 10% 6%;
    --accent: 195 100% 50%;  /* Cyan */
    --accent-foreground: 240 10% 6%;

    /* UI */
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 95%;
    --muted-foreground: 0 0% 45%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 51 100% 50%;
    --radius: 0.5rem;

    /* Convenience aliases */
    --gold: 51 100% 50%;
    --cyan: 195 100% 50%;
  }

  .dark {
    --background: 240 10% 4%;
    --foreground: 0 0% 98%;
    --card: 240 10% 5%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 5%;
    --popover-foreground: 0 0% 98%;

    --primary: 51 100% 50%;
    --primary-foreground: 240 10% 4%;
    --accent: 195 100% 50%;
    --accent-foreground: 240 10% 4%;

    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4% 16%;
    --muted-foreground: 0 0% 64%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 4% 16%;
    --input: 240 4% 16%;
    --ring: 51 100% 50%;

    --gold: 51 100% 50%;
    --cyan: 195 100% 50%;
  }

  * { @apply border-border; }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Sora', system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
    font-feature-settings: 'cv02','cv03','cv04','cv11';
    text-rendering: optimizeLegibility;
  }

  /* Monospace helper for technical UI chrome */
  code, kbd, samp, .font-mono {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  }
}

/* -----------------------------------------------------------
   Technical HUD / Controls
----------------------------------------------------------- */
@layer components {
  .hud-btn {
    --tw-ring-color: color-mix(in oklab, rgba(0,255,255,0.6) 60%, transparent);
    border-color: rgba(0, 255, 255, 0.35) !important;
    background: rgba(8, 12, 16, 0.60);
    backdrop-filter: saturate(120%) blur(6px);
    transition: background 160ms ease, transform 120ms ease, box-shadow 160ms ease;
  }
  .hud-btn:hover {
    background: rgba(12, 20, 26, 0.78);
    box-shadow: 0 0 0 1px rgba(0,255,255,0.25), 0 0 16px rgba(0,255,255,0.12) inset;
  }
  .hud-btn:active { transform: translateY(1px); }
  .hud-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,255,255,0.55);
  }

  .control-dock {
    @apply fixed bottom-3 left-1/2 -translate-x-1/2 z-50;
    display: flex; gap: 0.75rem;
  }

  .glass {
    background: color-mix(in oklab, rgba(8,12,16,0.7) 85%, transparent);
    backdrop-filter: blur(8px) saturate(120%);
    border: 1px solid rgba(0,255,255,0.15);
    box-shadow: 0 0 40px rgba(0, 255, 255, 0.05) inset;
  }

  .panel {
    @apply rounded-lg p-4;
    border: 1px solid rgba(0,255,255,0.22);
    background: linear-gradient(
      180deg,
      rgba(0, 18, 24, 0.78),
      rgba(0, 10, 14, 0.70)
    );
    color: hsl(var(--accent));
  }

  .kbd {
    @apply px-1.5 py-0.5 rounded border;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.75rem;
    line-height: 1rem;
    border-color: rgba(0, 255, 255, 0.25);
    background: rgba(0, 20, 24, 0.5);
    color: hsl(var(--accent));
  }
}

/* -----------------------------------------------------------
   Canvas & Rendering
----------------------------------------------------------- */
canvas {
  image-rendering: optimizeQuality;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* -----------------------------------------------------------
   Architectural Grid Background
   - Subtle animated cyan drafting grid with inner glow ring
----------------------------------------------------------- */
.synapse-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(0, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 0;
  pointer-events: none;
  animation: gridPulse 12s linear infinite;
}
.synapse-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 255, 255, 0.14);
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.05) inset;
  pointer-events: none;
  border-radius: 8px;
}

@keyframes gridPulse {
  0%   { opacity: 0.55; filter: hue-rotate(0deg) brightness(1); }
  50%  { opacity: 0.90; filter: hue-rotate(35deg) brightness(1.15); }
  100% { opacity: 0.55; filter: hue-rotate(0deg) brightness(1); }
}

/* -----------------------------------------------------------
   Micro-interactions & Motion
----------------------------------------------------------- */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.28s ease-out both; }

@keyframes glow-ping {
  0%   { box-shadow: 0 0 0 0 rgba(0,255,255,0.35); }
  70%  { box-shadow: 0 0 0 8px rgba(0,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,255,255,0); }
}
.glow-ping { animation: glow-ping 1.6s cubic-bezier(.2,.8,.2,1) infinite; }

/* Prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .glow-ping,
  .synapse-bg { animation: none !important; }
}

/* -----------------------------------------------------------
   Utility Touch-ups for Technical UI
----------------------------------------------------------- */
.hr-thin {
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(0,255,255,0) 0%,
    rgba(0,255,255,0.35) 15%,
    rgba(0,255,255,0.35) 85%,
    rgba(0,255,255,0) 100%
  );
}

.badge-cyan {
  border: 1px solid rgba(0,255,255,0.28);
  background: rgba(0, 30, 36, 0.45);
  color: hsl(var(--accent));
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
}

/* Tooltip shell (for future technical overlays) */
.tooltip {
  @apply rounded px-2 py-1 text-xs;
  border: 1px solid rgba(0,255,255,0.25);
  background: rgba(0,20,24,0.85);
  color: hsl(var(--accent));
  backdrop-filter: blur(6px) saturate(120%);
}
