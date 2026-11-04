import type { CSSProperties, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Box, Move3d, Shield, Users } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';
import './homeExploreV2.css';

type ExploreArtwork = {
  webp?: string;
  avif?: string;
  image: string;
};

type ExploreEntry = {
  id: 'showroom' | 'engineering' | 'drivers' | 'teams';
  to: string;
  label: string;
  Icon: typeof Box;
  artwork: ExploreArtwork;
};

function handleCardPointerMove(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
  event.currentTarget.style.setProperty('--ex-pointer-x', `${x.toFixed(1)}%`);
  event.currentTarget.style.setProperty('--ex-pointer-y', `${y.toFixed(1)}%`);
}

function clearCardPointer(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.removeProperty('--ex-pointer-x');
  event.currentTarget.style.removeProperty('--ex-pointer-y');
}

export function HomeStoryLinks() {
  const lang = useNavigationStore((state) => state.lang);
  const insideMachineTrialEnabled = import.meta.env.DEV;
  const { ref, isRevealed } = useReveal(0.1);

  // The four gateways are teasers only. Race data, standings, long-form copy
  // and engineering detail belong to their destination pages.
  const cards: ExploreEntry[] = [
    {
      id: 'showroom',
      to: '/showroom',
      label: 'Showroom 3D',
      Icon: Move3d,
      artwork: {
        image: '/images/p4/template/rc-hero-1344.webp',
        webp: '/images/p4/template/rc-hero-1344.webp',
        avif: '/images/p4/template/rc-hero-1344.avif',
      },
    },
    {
      id: 'engineering',
      to: insideMachineTrialEnabled ? '/engineering' : '/engineering/car-anatomy',
      label: lang === 'vi' ? 'Kỹ thuật' : 'Engineering',
      Icon: Box,
      artwork: { image: '/images/home/explore/engineering-flow.svg' },
    },
    {
      id: 'drivers',
      to: '/drivers',
      label: lang === 'vi' ? 'Tay đua' : 'Drivers',
      Icon: Users,
      artwork: { image: '/images/home/explore/driver-helmet.svg' },
    },
    {
      id: 'teams',
      to: '/teams',
      label: lang === 'vi' ? 'Đội đua' : 'Teams',
      Icon: Shield,
      artwork: { image: '/images/home/explore/team-garage.svg' },
    },
  ];

  return (
    <section
      ref={ref}
      className="page-container eds-explore h25-reveal"
      data-revealed={isRevealed}
      aria-labelledby="eds-explore-title"
    >
      <header className="eds-explore__header">
        <span className="eds-explore__mark" aria-hidden="true" />
        <h2 id="eds-explore-title">
          {lang === 'vi' ? 'Khám phá Podium EDS' : 'Explore Podium EDS'}
        </h2>
        <span className="eds-explore__header-rule" aria-hidden="true" />
      </header>
      <div className="eds-explore__grid">
        {cards.map((card, index) => {
          const Icon = card.Icon;
          return (
            <Link
              key={card.id}
              to={card.to}
              className={`eds-explore__card eds-explore__card--${card.id}`}
              onPointerMove={handleCardPointerMove}
              onPointerLeave={clearCardPointer}
              style={{ '--ex-order': index } as CSSProperties}
            >
              <div className="eds-explore__art" aria-hidden="true">
                <picture>
                  {card.artwork.avif && <source type="image/avif" srcSet={card.artwork.avif} />}
                  {card.artwork.webp && <source type="image/webp" srcSet={card.artwork.webp} />}
                  <img src={card.artwork.image} alt="" loading="lazy" decoding="async" />
                </picture>
              </div>
              <span className="eds-explore__grid-lines" aria-hidden="true" />
              <span className="eds-explore__light-pass" aria-hidden="true" />
              <span className="eds-explore__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="eds-explore__bottom">
                <span className="eds-explore__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.7} /></span>
                <strong>{card.label}</strong>
                <ArrowUpRight className="eds-explore__arrow" size={21} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
