import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { useNavigationStore } from '../../../store/useNavigationStore';
import './homeEngineeringReveal.css';

const parts = [
  {
    id: 'front-wing',
    index: '01',
    title: 'FRONT WING',
    vi: 'Cánh trước định hướng luồng không khí đến các khu vực phía sau xe, đồng thời góp phần tạo lực ép.',
    en: 'The front wing helps direct incoming air around the car while contributing aerodynamic load.',
  },
  {
    id: 'underfloor',
    index: '02',
    title: 'UNDERFLOOR',
    vi: 'Sàn xe và các kênh dẫn khí là phần cốt lõi của nguyên lý hiệu ứng mặt đất.',
    en: 'The underfloor and its airflow channels are central to the ground-effect concept.',
  },
  {
    id: 'diffuser',
    index: '03',
    title: 'DIFFUSER',
    vi: 'Bộ khuếch tán phía sau hỗ trợ quá trình mở rộng luồng khí thoát khỏi gầm xe.',
    en: 'The rear diffuser helps expand airflow exiting from beneath the car.',
  },
] as const;
type Part = (typeof parts)[number]['id'];

/** Lightweight conceptual assembly view; NOT Model B geometry or CFD output. */
export function HomeEngineeringReveal() {
  const lang = useNavigationStore((state) => state.lang);
  const [selected, setSelected] = useState<Part>('underfloor');
  const active = parts.find((part) => part.id === selected) ?? parts[1];
  return (
    <section id="eds-engineering" className="home-engineering page-container scroll-mt-20" aria-labelledby="home-engineering-title">
      <header className="home-engineering__header">
        <span className="home-engineering__eyebrow">EDS / ENGINEERING / 04</span>
        <h2 id="home-engineering-title">INSIDE THE <em>MACHINE.</em></h2>
        <p>{lang === 'vi'
          ? 'Ba thành phần khí động học. Một nguyên lý: kiểm soát luồng khí đi quanh và bên dưới chiếc xe.'
          : 'Three aerodynamic systems. One principle: shaping the air around and underneath the car.'}</p>
      </header>
      <div className="home-engineering__stage">
        <div className="home-engineering__diagram">
          <span className="home-engineering__datum">EXPLODED STUDY / CONCEPTUAL GEOMETRY</span>
          <svg viewBox="0 0 740 430" fill="none" role="img" aria-label={lang === 'vi' ? 'Minh họa tách lớp ba bộ phận khí động học' : 'Conceptual exploded view of three aerodynamic systems'}>
            <defs>
              <linearGradient id="home-tech-shell" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#809DAC" />
                <stop offset=".25" stopColor="#344C5A" />
                <stop offset=".6" stopColor="#101A26" />
                <stop offset="1" stopColor="#536D7B" />
              </linearGradient>
              <linearGradient id="home-tech-accent" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#83D8F1" />
                <stop offset=".6" stopColor="#DCECF2" />
                <stop offset="1" stopColor="#FF7843" />
              </linearGradient>
            </defs>
            <g opacity=".18" stroke="#81A8B9" strokeWidth=".75">
              <path d="M0 105H740M0 215H740M0 325H740M180 0V430M370 0V430M560 0V430" strokeDasharray="4 10"/>
            </g>
            <g className="home-engineering__part" data-active={selected === 'front-wing'} data-part="front-wing">
              <path d="M75 140C164 85 261 75 342 101L368 135C267 111 177 135 76 176Z" fill="url(#home-tech-shell)" stroke="#94C5D7" strokeWidth="2"/>
              <path d="M82 188C158 142 264 127 361 161L349 185C244 157 151 179 75 216Z" fill="#111F2B" stroke="url(#home-tech-accent)" strokeWidth="2"/>
              <path d="M203 103L215 185M270 100L268 169" stroke="#9ABFD0" strokeWidth="4" opacity=".62"/>
            </g>
            <g className="home-engineering__part" data-active={selected === 'underfloor'} data-part="underfloor">
              <path d="M262 227L503 156L640 193L397 275Z" fill="url(#home-tech-shell)" stroke="#A5C8D9" strokeWidth="2"/>
              <path d="M268 248L400 291L641 212L638 195L397 275L262 227Z" fill="#121F2B" stroke="#FF7A48" strokeWidth="2"/>
              <path d="M315 235L518 176M341 248L550 187M367 261L579 197" stroke="#74BBD8" opacity=".7" strokeWidth="2"/>
            </g>
            <g className="home-engineering__part" data-active={selected === 'diffuser'} data-part="diffuser">
              <path d="M436 326L611 271L677 310L519 378Z" fill="url(#home-tech-shell)" stroke="#99BFD2" strokeWidth="2"/>
              <path d="M453 332L514 351L635 307M471 345L526 362L649 321M487 358L537 376L660 331" stroke="#FF7B45" strokeWidth="3"/>
            </g>
            <g stroke="#93B5C6" strokeWidth="1" strokeDasharray="4 6" opacity=".68">
              <path d="M344 182L422 221M440 277L468 314"/>
            </g>
            <g fill="#F7C09E" fontFamily="monospace" fontSize="12" fontWeight="600">
              <text x="75" y="63">01 / FRONT WING</text>
              <text x="406" y="126">02 / UNDERFLOOR</text>
              <text x="533" y="405">03 / DIFFUSER</text>
            </g>
          </svg>
          <span className="home-engineering__diagram-note">EDUCATIONAL VISUALIZATION / NOT CFD</span>
        </div>
        <div className="home-engineering__inspector">
          <span className="home-engineering__inspector-label">{lang === 'vi' ? 'CHỌN CHI TIẾT' : 'SELECT COMPONENT'}</span>
          <div role="group" aria-label={lang === 'vi' ? 'Bộ phận khí động học' : 'Aerodynamic components'}>
            {parts.map((part) => (
              <button key={part.id} type="button" aria-pressed={selected === part.id} onClick={() => setSelected(part.id)}>
                <span>{part.index}</span><strong>{part.title}</strong><ChevronRight size={16} aria-hidden="true"/>
              </button>
            ))}
          </div>
          <div className="home-engineering__inspector-info" aria-live="polite">
            <span>COMPONENT / {active.index}</span>
            <h3>{active.title}</h3>
            <p>{lang === 'vi' ? active.vi : active.en}</p>
            <Link to="/engineering/car-anatomy">
              {lang === 'vi' ? 'KHÁM PHÁ CHI TIẾT' : 'EXPLORE THE ENGINEERING'}
              <ArrowUpRight size={18} aria-hidden="true"/>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
