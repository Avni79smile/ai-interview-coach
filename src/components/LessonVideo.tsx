import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { Scene } from "@/lib/course-types";
import { TUTOR } from "@/lib/avatars";

export function LessonVideo({ scenes, title, onEnd }: { scenes: Scene[]; title: string; onEnd: () => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const scene = scenes[i];
  const dur = Math.max(6000, (scene?.narration.split(" ").length ?? 20) * 380);

  useEffect(() => { setI(0); setPlaying(false); setElapsed(0); }, [scenes]);

  useEffect(() => {
    if (!playing || !scene) return;
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (voice && synth) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(scene.narration);
      u.rate = 1;
      synth.speak(u);
    }
    setElapsed(0);
    const start = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - start), 100);
    const t = setTimeout(() => {
      if (i < scenes.length - 1) setI(i + 1);
      else { setPlaying(false); endRef.current(); }
    }, dur);
    return () => { clearTimeout(t); clearInterval(tick); synth?.cancel(); };
  }, [playing, i, voice, scene, dur, scenes.length]);

  if (!scene) return null;
  const overall = ((i + Math.min(elapsed / dur, 1)) / scenes.length) * 100;

  return (
    <div className="overflow-hidden rounded-3xl bg-ink shadow-soft">
      <div className="relative aspect-video overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-ink/85" />
        <div key={i} className="absolute inset-0 flex flex-col justify-center p-6 md:p-12">
          <span className="animate-pop text-5xl md:text-7xl">{scene.emoji}</span>
          <h3 className="animate-scene mt-4 text-2xl font-bold text-ink-foreground md:text-4xl" style={{ animationDelay: ".15s" }}>{scene.heading}</h3>
          <ul className="mt-4 max-w-[62%] space-y-2">
            {scene.bullets.map((b, k) => (
              <li key={b} className="animate-scene flex gap-2 text-sm text-sidebar-foreground md:text-lg" style={{ animationDelay: `${0.4 + k * 0.5}s` }}>
                <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />{b}
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col items-center md:bottom-6 md:right-8">
          <img src={TUTOR} alt="Tutor avatar" className={`w-24 md:w-40 ${playing ? "animate-float" : ""}`} />
          {playing && <div className="mt-1 flex h-4 gap-1">{[0, 1, 2, 3].map((k) => <span key={k} className="w-1 animate-talk rounded bg-accent" style={{ animationDelay: `${k * 0.12}s` }} />)}</div>}
        </div>
        <div className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs text-ink-foreground">{title} · Scene {i + 1}/{scenes.length}</div>
        {!playing && (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center" aria-label="Play">
            <span className="grid size-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-soft transition hover:scale-110"><Play className="size-8 translate-x-0.5" /></span>
          </button>
        )}
      </div>
      <div className="px-4 pb-3 pt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-sidebar-accent"><div className="h-full bg-accent transition-all" style={{ width: `${overall}%` }} /></div>
        <div className="mt-2 flex items-center gap-3 text-ink-foreground">
          <button onClick={() => setI(Math.max(0, i - 1))} aria-label="Previous"><SkipBack className="size-5" /></button>
          <button onClick={() => setPlaying(!playing)} aria-label="Play/pause">{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</button>
          <button onClick={() => (i < scenes.length - 1 ? setI(i + 1) : onEnd())} aria-label="Next"><SkipForward className="size-5" /></button>
          <button onClick={() => setVoice(!voice)} aria-label="Toggle voice">{voice ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}</button>
          <p className="ml-2 line-clamp-1 flex-1 text-xs text-sidebar-foreground/70">{scene.narration}</p>
        </div>
      </div>
    </div>
  );
}
