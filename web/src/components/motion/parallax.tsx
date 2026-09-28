"use client";
// beui.dev/components/motion/scroll-animation

import {
  motion,
  type MotionStyle,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, type RefObject, useRef } from "react";

import { cn } from "@/lib/utils";

// Soft follow so the drift trails the scroll smoothly; looser than the UI
// springs in lib/ease.ts on purpose.
const PARALLAX_SPRING = { stiffness: 120, damping: 30, mass: 0.6 };

export interface ParallaxProps {
  children: ReactNode;
  /**
   * Drift as a fraction of the element's travel through the viewport.
   * Positive moves with the scroll (foreground), negative against it
   * (background). ~0.1–0.5 reads best.
   */
  speed?: number;
  axis?: "x" | "y";
  /** Scroll container for contained scroll areas. Defaults to the viewport. */
  container?: RefObject<HTMLElement | null>;
  /** Spring-smooth the drift. Disabled automatically under reduced motion. */
  spring?: boolean;
  className?: string;
}

export function Parallax({
  children,
  speed = 0.3,
  axis = "y",
  container,
  spring = true,
  className,
}: ParallaxProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ["start end", "end start"],
    // Run after paint so a container ref defined higher in the tree is hydrated;
    // otherwise framer falls back to the document and only the page scroll works.
    // ⚠️ 本仓库的 motion 13 已经**不认这个选项**了（`UseScrollOptions` 里没有
    // `layoutEffect`，`motion/` 整个包里也搜不到这个字符串）—— 上游是按
    // framer-motion 11 的语义写的。留着它是因为它是上游源码、且是**唯一的**意图
    // 记录，`@ts-expect-error` 同时当探针：哪天上游或 motion 对上了，这行会反过来
    // 报"未使用的 expect-error"，提醒可以删掉。
    // @ts-expect-error motion 13 的 UseScrollOptions 没有 layoutEffect
    layoutEffect: false,
  });

  // progress 0→1 as the element crosses the viewport; map to a symmetric drift.
  const travel = speed * 100;
  const drift = useTransform(scrollYProgress, [0, 1], [travel, -travel]);
  const smoothed = useSpring(drift, PARALLAX_SPRING);
  const value = spring && !reduce ? smoothed : drift;

  const style: MotionStyle = reduce ? {} : axis === "x" ? { x: value } : { y: value };

  return (
    <motion.div ref={ref} style={style} className={cn(className)}>
      {children}
    </motion.div>
  );
}
