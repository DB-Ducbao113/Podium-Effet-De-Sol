import { useEffect } from 'react';
import type { RefObject } from 'react';
import { animate, createScope } from 'animejs';
import { getV5HeroMotion } from './homeV5Motion';
import { sampleV5Scene } from './homeV5Choreography';
import { readMotionEngine } from '../../motion/motionEngine';
import { loadGsapRuntime } from '../../motion/gsapRuntime';
import { readHomeMotionPolicy } from '../../motion/motionPolicy';

/** Pure so the property list and the sampler can never disagree. */
function sampleHero(top: number, height: number, viewport: number, staticMode: boolean) {
  const motion = getV5HeroMotion(top, height, viewport, staticMode);
  const scene = sampleV5Scene(motion.progress);
  return {
    scene: motion.scene,
    values: {
      '--v5-scene-one': motion.first.toFixed(3),
      '--v5-scene-two': motion.second.toFixed(3),
      '--v5-scene-three': motion.third.toFixed(3),
      '--v5-shift': motion.shift.toFixed(1) + 'px',
      '--v5-progress': motion.progress.toFixed(3),
      '--v5-ambient-x': (motion.progress * 55).toFixed(1) + 'px',
      // Readable hero title/CTA and verified instrument values stay visible
      // while their spatial position responds to the same scroll coordinate.
      '--v5-copy-x': (-16 * motion.progress).toFixed(1) + 'px',
      '--v5-copy-y': (-24 * motion.progress).toFixed(1) + 'px',
      '--v5-stat-x': (14 * motion.progress).toFixed(1) + 'px',
      '--v5-stat-x-negative': (-14 * motion.progress).toFixed(1) + 'px',
      '--v5-first-x': scene.firstX.toFixed(1) + 'px',
      '--v5-first-mask': scene.firstMask.toFixed(1) + '%',
      '--v5-second-x': scene.secondX.toFixed(1) + 'px',
      '--v5-second-mask-left': scene.secondMaskLeft.toFixed(1) + '%',
      '--v5-second-mask-right': scene.secondMaskRight.toFixed(1) + '%',
      '--v5-third-x': scene.thirdX.toFixed(1) + 'px',
      '--v5-third-mask': scene.thirdMask.toFixed(1) + '%',
      '--v5-photo2-opacity': scene.photo2Opacity.toFixed(3),
      '--v5-photo2-clip': scene.photo2Clip.toFixed(1) + '%',
      '--v5-photo2-x': scene.photo2X.toFixed(1) + 'px',
      '--v5-photo3-opacity': scene.photo3Opacity.toFixed(3),
      '--v5-photo3-clip': scene.photo3Clip.toFixed(1) + '%',
      '--v5-photo3-x': scene.photo3X.toFixed(1) + 'px',
    },
  };
}

const HERO_PROPERTIES = Object.keys(sampleHero(0, 1000, 900, true).values);

export function useHomeHeroMotion(ref: RefObject<HTMLElement | null>, reducedMotion: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion) return;
    const nodes = root.querySelectorAll<HTMLElement>('[data-launch-reveal]');

    if (readMotionEngine() !== 'gsap') {
      const scope = createScope({ root }).add(() => {
        animate(nodes, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 660,
          ease: 'out(4)',
          delay: (_: unknown, index = 0) => index * 95,
        });
      });
      return () => scope.revert();
    }

    let cancelled = false;
    let tween: { revert: () => void } | null = null;
    loadGsapRuntime().then((runtime) => {
      if (!runtime || cancelled || !nodes.length) return;
      tween = runtime.gsap.fromTo(
        nodes,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.66, ease: 'expo.out', stagger: 0.095 },
      );
    });
    return () => {
      cancelled = true;
      tween?.revert();
    };
  }, [ref, reducedMotion]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const write = () => {
      const wrapper = root.closest<HTMLElement>('[data-home-v5-scroll]');
      if (!wrapper) return;
      const policy = readHomeMotionPolicy();
      const rect = wrapper.getBoundingClientRect();
      const frame = sampleHero(
        rect.top,
        rect.height,
        policy.viewport.height,
        // F10.02: scroll drives the narrative, never the size or visibility of the car.
        policy.tier === 'off' || policy.viewport.compact,
      );
      root.dataset.v5Scene = String(frame.scene);
      for (const [property, value] of Object.entries(frame.values)) root.style.setProperty(property, value);
    };

    const clear = () => {
      delete root.dataset.v5Scene;
      for (const property of HERO_PROPERTIES) root.style.removeProperty(property);
    };

    if (readMotionEngine() !== 'gsap') {
      let raf = 0;
      // The handle must clear inside the callback: a queued-only guard freezes
      // the hero at its mount frame after the first scroll.
      const draw = () => {
        raf = 0;
        write();
      };
      const schedule = () => {
        if (raf === 0) raf = requestAnimationFrame(draw);
      };
      schedule();
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        clear();
      };
    }

    let cancelled = false;
    let trigger: { kill: () => void } | null = null;
    loadGsapRuntime().then((runtime) => {
      if (!runtime || cancelled) return;
      const wrapper = root.closest<HTMLElement>('[data-home-v5-scroll]');
      if (!wrapper) return;
      trigger = runtime.ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        onRefresh: write,
        onUpdate: write,
      });
      write();
    });
    return () => {
      cancelled = true;
      trigger?.kill();
      clear();
    };
  }, [ref]);
}
