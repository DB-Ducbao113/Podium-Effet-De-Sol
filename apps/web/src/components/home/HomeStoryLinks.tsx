import type { CSSProperties, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Box, Move3d, Shield, Users } from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReveal } from '../../hooks/useReveal';
import './homeExploreV2.css';

type GatewayId = 'showroom' | 'engineering' | 'drivers' | 'teams';
type Gateway = {
  id: GatewayId;
  to: string;
  label: string;
  Icon: typeof Box;
  fallback: string;
};

const REVIEW_ROOT = '/__peds-home-explore';

function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
  if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
  event.currentTarget.style.setProperty('--ex-pointer-x', `${x.toFixed(1)}%`);
  event.currentTarget.style.setProperty('--ex-pointer-y', `${y.toFixed(1)}%`);
  event.currentTarget.style.setProperty('--ex-tilt-x', `${((50 - y) * .052).toFixed(2)}deg`);
  event.currentTarget.style.setProperty('--ex-tilt-y', `${((x - 50) * .052).toFixed(2)}deg`);
  event.currentTarget.style.setProperty('--ex-shift-x', `${((50 - x) * .14).toFixed(1)}px`);
  event.currentTarget.style.setProperty('--ex-shift-y', `${((50 - y) * .12).toFixed(1)}px`);
}

function clearPointer(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.removeProperty('--ex-pointer-x');
  event.currentTarget.style.removeProperty('--ex-pointer-y');
  event.currentTarget.style.removeProperty('--ex-tilt-x');
  event.currentTarget.style.removeProperty('--ex-tilt-y');
  event.currentTarget.style.removeProperty('--ex-shift-x');
  event.currentTarget.style.removeProperty('--ex-shift-y');
}

export function HomeStoryLinks() {
  const lang = useNavigationStore((state) => state.lang);
  const localReview = import.meta.env.DEV;
  const { ref, isRevealed } = useReveal(0.1);

  // Gallery backgrounds: local-only, identity-checked owner review.
  // No model, trademark, video or extra racing data is introduced in production.
  const cards: Gateway[] = [
    {
      id: 'showroom',
      to: '/showroom',
      label: 'Showroom 3D',
      Icon: Move3d,
      fallback: '/images/p4/template/rc-hero-1344.webp',
    },
    {
      id: 'engineering',
      to: localReview ? '/engineering' : '/engineering/car-anatomy',
      label: lang === 'vi' ? 'Kỹ thuật' : 'Engineering',
      Icon: Box,
      fallback: '/images/home/explore/engineering-flow.svg',
    },
    {
      id: 'drivers',
      to: '/drivers',
      label: lang === 'vi' ? 'Tay đua' : 'Drivers',
      Icon: Users,
      fallback: '/images/home/explore/driver-helmet.svg',
    },
    {
      id: 'teams',
      to: '/teams',
      label: lang === 'vi' ? 'Đội đua' : 'Teams',
      Icon: Shield,
      fallback: '/images/home/explore/team-garage.svg',
    },
  ];

  return (
    <section
      id="eds-explore"
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
        {cards.map(({ id, to, label, Icon, fallback }, index) => (
          <Link
            key={id}
            to={to}
            className={`eds-explore__card eds-explore__card--${id}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={clearPointer}
            style={{ '--ex-order': index } as CSSProperties}
          >
            <span className="eds-explore__art" aria-hidden="true">
              <img
                src={localReview ? `${REVIEW_ROOT}/${id}.webp` : fallback}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  if (!event.currentTarget.src.endsWith(fallback)) {
                    event.currentTarget.src = fallback;
                  }
                }}
              />
            </span>
            <span className="eds-explore__grid-lines" aria-hidden="true" />
            <span className="eds-explore__light-pass" aria-hidden="true" />
            <span className="eds-explore__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="eds-explore__bottom">
              <span className="eds-explore__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <strong>{label}</strong>
              <ArrowUpRight className="eds-explore__arrow" size={23} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
