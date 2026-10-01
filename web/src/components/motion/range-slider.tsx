"use client";
// beui.dev/components/motion/range-slider

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";

import { SPRING_GLIDE } from "@/lib/ease";
import { type SliderOptions, useSlider } from "@/lib/hooks/use-slider";
import { TOUCH_GESTURE_CLASS } from "@/lib/touch";
import { cn } from "@/lib/utils";

// Bouncy grab feedback for the thumb scale only.
const SPRING_BOUNCY = { type: "spring", stiffness: 500, damping: 14, mass: 0.7 } as const;

export interface RangeSliderProps extends SliderOptions {
  /** Render a tick dot at each step. */
  showTicks?: boolean;
  className?: string;
}

export function RangeSlider({ showTicks = true, className, ...options }: RangeSliderProps) {
  const reduce = useReducedMotion();
  const { percent, dragging, min, max, step, trackProps, sliderProps } = useSlider(options);
  const [trackWidth, setTrackWidth] = useState(292);
  useLayoutEffect(() => {
    const track = trackProps.ref.current;
    if (!track) return;
    const measure = () => {
      const width = track.getBoundingClientRect().width;
      if (width > 0) setTrackWidth(width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [trackProps.ref]);

  // Spring-smoothed position drives both the thumb and the fill.
  const target = useMotionValue(percent);
  useEffect(() => {
    target.set(percent);
  }, [percent, target]);
  const smooth = useSpring(target, SPRING_GLIDE);
  const pos = reduce ? target : smooth;
  const thumbX = useTransform(pos, (p) => 8 + Math.max(0, trackWidth - 20) * p / 100);
  // Match InlineSlider: full-size fill translated inside the 2px inset clip, so the
  // corner never stretches as the 4px handle travels 8px inside the track.
  const fillX = useTransform(pos, (p) => p >= 100
    ? "0%"
    : `calc(${p - 100}% + ${14 - 0.16 * p}px)`);

  // Floor, not round, so a step that does not divide the range stops at the last
  // whole step; `toFixed` first to keep 0.3/0.1 from flooring a dot away.
  const steps = Math.floor(Number(((max - min) / step).toFixed(6)));
  const ticks =
    showTicks && steps > 0 && steps <= 50
      ? Array.from({ length: steps + 1 }, (_, i) => Number((min + i * step).toFixed(6)))
      : [];

  return (
    <div
      {...trackProps}
      // frosted blur hook
      data-slot="slider-track"
      className={cn(
        "relative flex h-10 w-full touch-none items-center overflow-hidden rounded-lg bg-muted",
        TOUCH_GESTURE_CLASS,
        options.disabled
          ? "pointer-events-none opacity-50"
          : "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[2px] inset-y-0 overflow-hidden rounded-lg">
        <motion.div className="absolute inset-0 rounded-lg bg-foreground/15" style={{ x: fillX }} />
      </div>

      {/* Tick centres follow the same inset path as the handle centre. */}
      <div className="pointer-events-none absolute inset-x-[10px] inset-y-0">
        {ticks.map((t) => {
          const tp = ((t - min) / (max - min)) * 100;
          return (
            <span
              key={t}
              className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25"
              style={{ left: `${tp}%` }}
            />
          );
        })}
      </div>

      {/* Keep the handle inside the rounded progress fill at both ends. */}
      <motion.div
        {...sliderProps}
        animate={reduce ? undefined : { scaleY: dragging ? 1.35 : 1 }}
        transition={SPRING_BOUNCY}
        className="absolute left-0 top-1/2 h-6 w-1 rounded-full bg-foreground outline-none ring-inset ring-foreground/30 focus-visible:ring-4"
        style={{ x: thumbX, y: "-50%" }}
      />
    </div>
  );
}
