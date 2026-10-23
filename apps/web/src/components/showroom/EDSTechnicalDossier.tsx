import React from 'react';
import { EDSLiveryPreset } from '../../data/showroom/edsLiveries';

interface Props {
  lang: 'vi' | 'en';
  livery: EDSLiveryPreset;
}

const pillars = [
  {
    code: '01',
    titleVi: 'Sàn Delta & Venturi',
    titleEn: 'Delta Floor & Venturi',
    bodyVi:
      'Bốn fence dọc, hai vai sàn mở rộng và diffuser năm strake tạo kiến trúc hiệu ứng mặt đất riêng.',
    bodyEn:
      'Four longitudinal fences, broad delta shoulders and a five-strake diffuser define the original ground-effect package.',
  },
  {
    code: '02',
    titleVi: 'Thân xe giọt nước',
    titleEn: 'Teardrop Bodywork',
    bodyVi:
      'Sidepod loft tham số co nhanh về đuôi, kết hợp sống lưng trung tâm và môi hút khí tương phản.',
    bodyEn:
      'Parametric sidepod lofts contract toward the tail beneath a central spine and contrasting intake lips.',
  },
  {
    code: '03',
    titleVi: 'Buồng lái & an toàn',
    titleEn: 'Cockpit & Safety',
    bodyVi:
      'Cửa cockpit lục giác và vòng bảo vệ quét ngược là hai dấu hiệu nhận diện hình học EDS-G01.',
    bodyEn:
      'A hexagonal cockpit opening and swept safety loop establish two EDS-G01 geometric signatures.',
  },
  {
    code: '04',
    titleVi: 'Bánh xe nguyên bản',
    titleEn: 'Original Wheel System',
    bodyVi:
      'Lốp trơn không chữ, mâm khí động học trung tính và đĩa phanh khái niệm không dùng trade dress nhà cung cấp.',
    bodyEn:
      'Unlettered slicks, neutral aero rims and conceptual brake discs avoid supplier trade dress.',
  },
];

export const EDSTechnicalDossier: React.FC<Props> = ({ lang, livery }) => (
  <div
    id="technical-dossier"
    className="scroll-mt-14 border-t border-studio-800 bg-studio-950 py-12 text-white"
  >
    <div className="page-container space-y-8">
      <header className="flex flex-col gap-4 border-b border-studio-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            {lang === 'vi' ? 'Hồ sơ kỹ thuật nguyên bản' : 'Original engineering dossier'}
          </p>
          <h3 className="mt-2 font-display text-3xl font-black uppercase">
            EDS-G01 <span className="text-studio-500">// {livery.name}</span>
          </h3>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 font-mono text-xs text-cyan-100">
          M2-P2-R1 · 14 assemblies · 5.05 m
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <article
            key={pillar.code}
            className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
                {pillar.code}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-studio-500">EDS-G01</span>
            </div>
            <h4 className="font-display text-base font-bold uppercase">
              {lang === 'vi' ? pillar.titleVi : pillar.titleEn}
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-studio-400">
              {lang === 'vi' ? pillar.bodyVi : pillar.bodyEn}
            </p>
          </article>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-studio-500">
        {lang === 'vi'
          ? 'Thiết kế và tài sản do dự án tạo, nhưng trạng thái thương mại vẫn cần rà soát pháp lý độc lập; nguồn gốc tự tạo không tự động bảo đảm không có rủi ro quyền sở hữu trí tuệ.'
          : 'Project-authored design and assets still require independent legal review; original generation does not automatically establish freedom from third-party rights risk.'}
      </p>
    </div>
  </div>
);
