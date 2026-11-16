import { useEffect } from 'react';
import type { RefObject } from 'react';
import { sampleV5Target } from './homeV5Choreography';
import type { HomeV5Effect } from './homeV5Choreography';
import {
  HOME_V5_ANIMATED_PROPERTIES,
  HOME_V5_ENTRIES,
  HOME_V5_SECTIONS,
} from './homeV5ChoreographyEntries';
import { loadGsapRuntime } from '../../motion/gsapRuntime';
import type { GsapRuntime, ScrollTriggerInstance } from '../../motion/gsapRuntime';
import { readMotionEngine } from '../../motion/motionEngine';
import { readHomeMotionPolicy } from '../../motion/motionPolicy';
import type { HomeMotionPolicy } from '../../motion/motionPolicy';

type Target = {
  node: HTMLElement;
  section: HTMLElement;
  offset: number;
  height: number;
  kind: HomeV5Effect;
  order: number;
  lastEnter?: number;
  lastExit?: number;
};

/**
 * ScrollTrigger replaces the hand-rolled scroll loop: one trigger per section, active
 * only while that section overlaps the viewport. Frames still come from sampleV5Item
 * read off the section's measured top, so one scroll position maps to one frame in
 * either direction, and delivery stays on CSS custom properties so the reduced-motion
 * and :focus-within rules in homeCinematicV5.css keep winning over the engine.
 */
export function useHomeGsapChoreography(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (readMotionEngine() !== 'gsap') return;
    const root = ref.current;
    if (!root) return;

    let runtime: GsapRuntime | null = null;
    let triggers: ScrollTriggerInstance[] = [];
    let targets: Target[] = [];
    let grouped: [HTMLElement, Target[]][] = [];
    let policy: HomeMotionPolicy = readHomeMotionPolicy();
    let resizeFrame = 0;
    let disposed = false;
    let teardown: (() => void) | null = null;

    const reset = () => {
      root.removeAttribute('data-v5-choreo');
      root.removeAttribute('data-v5-engine');
      for (const { node } of targets) {
        node.removeAttribute('data-v5-effect');
        for (const prop of HOME_V5_ANIMATED_PROPERTIES) node.style.removeProperty(prop);
      }
      targets = [];
      grouped = [];
    };

    const drawSection = (section: HTMLElement, items: Target[]) => {
      if (policy.tier === 'off') return;
      const top = section.getBoundingClientRect().top;
      for (const target of items) {
        const value = sampleV5Target(target, top, policy.viewport.height, policy.lite);
        // Both phases are required: before-entry and after-exit have
        // visibility=0 but deliberately opposite slide/mask positions.
        if (
          target.lastEnter !== undefined &&
          target.lastExit !== undefined &&
          Math.abs(target.lastEnter - value.enter) < .001 &&
          Math.abs(target.lastExit - value.exit) < .001
        ) continue;
        target.lastEnter = value.enter;
        target.lastExit = value.exit;
        const node = target.node;
        node.style.setProperty('--v5-anim-x', value.x.toFixed(1) + 'px');
        node.style.setProperty('--v5-anim-y', value.y.toFixed(1) + 'px');
        node.style.setProperty('--v5-anim-alpha', value.alpha.toFixed(3));
        node.style.setProperty('--v5-anim-left', value.left.toFixed(1) + '%');
        node.style.setProperty('--v5-anim-right', value.right.toFixed(1) + '%');
        node.style.setProperty('--v5-anim-bottom', value.bottom.toFixed(1) + '%');
      }
    };

    const collect = () => {
      reset();
      policy = readHomeMotionPolicy();
      if (policy.tier === 'off') return;
      const sectionRects = new Map<HTMLElement, DOMRect>();
      for (const [selector, kind] of HOME_V5_ENTRIES) {
        root.querySelectorAll<HTMLElement>(selector).forEach((node, order) => {
          const section = node.closest<HTMLElement>(HOME_V5_SECTIONS);
          if (!section) return;
          let rect = sectionRects.get(section);
          if (!rect) {
            rect = section.getBoundingClientRect();
            sectionRects.set(section, rect);
          }
          const box = node.getBoundingClientRect();
          targets.push({ node, section, offset: box.top - rect.top, height: box.height, kind, order });
        });
      }
      for (const { node, kind } of targets) node.dataset.v5Effect = kind;
      root.dataset.v5Choreo = 'active';
      root.dataset.v5Engine = 'gsap';
      grouped = [...new Set(targets.map(({ section }) => section))].map((section) => [
        section,
        targets.filter((target) => target.section === section),
      ]);
    };

    const rebuild = () => {
      if (!runtime) return;
      for (const trigger of triggers) trigger.kill();
      triggers = [];
      collect();
      if (policy.tier === 'off') return;
      triggers = grouped.map(([section, items]) =>
        runtime!.ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          onRefresh: () => drawSection(section, items),
          onUpdate: () => drawSection(section, items),
        }),
      );
      for (const [section, items] of grouped) drawSection(section, items);
    };

    const scheduleRebuild = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        rebuild();
      });
    };

    loadGsapRuntime().then((resolved) => {
      if (!resolved || disposed) return;
      runtime = resolved;
      resolved.ScrollTrigger.config({ ignoreMobileResize: true });

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const compact = window.matchMedia('(max-width: 860px)');
      const mutation = typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver((records) => {
            if (
              records.some((record) =>
                [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1),
              )
            ) scheduleRebuild();
          });
      mutation?.observe(root, { childList: true, subtree: true });

      rebuild();
      reduced.addEventListener('change', scheduleRebuild);
      compact.addEventListener('change', scheduleRebuild);
      window.addEventListener('resize', scheduleRebuild);
      document.addEventListener('visibilitychange', scheduleRebuild);

      teardown = () => {
        for (const trigger of triggers) trigger.kill();
        triggers = [];
        mutation?.disconnect();
        reduced.removeEventListener('change', scheduleRebuild);
        compact.removeEventListener('change', scheduleRebuild);
        window.removeEventListener('resize', scheduleRebuild);
        document.removeEventListener('visibilitychange', scheduleRebuild);
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        reset();
      };
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [ref]);
}
