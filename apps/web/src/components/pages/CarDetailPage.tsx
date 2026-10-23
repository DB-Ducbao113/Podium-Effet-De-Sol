import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gauge, Ruler, Settings2, Weight, Box } from 'lucide-react';
import { getCarById } from '../../data/cars';
import { TEAMS_DATA } from '../../data/teams';
import { getTeamSeasonProfile } from '../../data/teamSeasons';
import { useNavigationStore } from '../../store/useNavigationStore';
import { ConstructorLogo } from '../common/ConstructorLogo';

export const CarDetailPage: React.FC = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const lang = useNavigationStore((state) => state.lang);
  const car = carId ? getCarById(carId) : undefined;

  if (!car) {
    return (
      <div className="page-container py-24 min-h-[60vh] text-center">
        <p className="text-f1red font-black text-5xl">404</p>
        <h1 className="mt-4 text-xl font-bold">
          {lang === 'vi' ? 'Không tìm thấy xe đua' : 'Car not found'}
        </h1>
        <Link className="inline-block mt-6 text-f1red font-bold" to="/season/2026">
          {lang === 'vi' ? 'Về mùa giải' : 'Back to season'}
        </Link>
      </div>
    );
  }

  const team = TEAMS_DATA[car.teamId];
  const seasonProfile = getTeamSeasonProfile(car.teamId, car.season);
  const specs = car.officialSpecs;
  const highlights = [
    [
      lang === 'vi' ? 'Hệ thống treo trước' : 'Front suspension',
      car.technicalHighlights?.frontSuspension,
    ],
    [
      lang === 'vi' ? 'Hệ thống treo sau' : 'Rear suspension',
      car.technicalHighlights?.rearSuspension,
    ],
    [
      lang === 'vi' ? 'Triết lý khí động học' : 'Aerodynamic philosophy',
      car.technicalHighlights?.aeroPhilosophy,
    ],
    [
      lang === 'vi' ? 'Hiệu ứng mặt đất' : 'Ground effect',
      car.technicalHighlights?.groundEffectNotes,
    ],
    [
      lang === 'vi' ? 'Kết cấu khung gầm' : 'Chassis construction',
      car.technicalHighlights?.chassisConstruction,
    ],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="min-h-[70vh] bg-studio-100 py-10 sm:py-16">
      <div className="page-container space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate(`/teams/${car.teamId}?season=${car.season}`);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-studio-200 text-xs font-bold uppercase tracking-wider text-studio-700 hover:text-f1red hover:border-f1red transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-400">
            <Link
              to={`/teams/${car.teamId}?season=${car.season}`}
              className="hover:text-f1red transition-colors text-studio-500"
            >
              {team.name} ({car.season})
            </Link>
            <span>/</span>
            <span className="text-studio-900">{car.name}</span>
          </div>
        </div>
        <header className="relative min-h-[360px] overflow-hidden rounded-3xl bg-studio-950 text-white">
          {car.heroImage && (
            <img
              src={car.heroImage}
              alt={`${car.name} editorial profile illustrated with the original Podium EDS-G01 concept`}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-55"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-studio-950 via-studio-950/75 to-studio-950/15" />
          <div
            className="absolute inset-y-0 left-0 w-2"
            style={{ backgroundColor: car.primaryColor }}
          />
          <div className="relative flex min-h-[360px] flex-col justify-end p-7 sm:p-12">
            <div className="flex items-center gap-2.5">
              <ConstructorLogo teamId={car.teamId} size="sm" />
              <span
                className="text-xs font-black uppercase tracking-[0.25em]"
                style={{ color: car.primaryColor }}
              >
                {car.season} · {seasonProfile?.fullName || team.fullName}
              </span>
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-black uppercase tracking-tight sm:text-6xl">
              {car.name}
            </h1>
            {(lang === 'vi' ? car.descriptionVi : car.descriptionEn) && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-studio-200">
                {lang === 'vi' ? car.descriptionVi : car.descriptionEn}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/teams/${car.teamId}?season=${car.season}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-studio-950 hover:bg-studio-100"
              >
                {lang === 'vi' ? 'Hồ sơ đội' : 'Team profile'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={`/showroom?team=${car.teamId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-f1red hover:bg-red-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:shadow-f1red/30 transition-all hover:scale-105"
              >
                <Box className="w-4 h-4" />
                <span>{lang === 'vi' ? 'Xem trong Showroom 3D' : 'View in 3D Showroom'}</span>
              </Link>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-f1red">
              {lang === 'vi' ? 'Thông số' : 'Specifications'}
            </p>
            <h2 className="font-display text-2xl font-black uppercase sm:text-3xl">
              {lang === 'vi' ? 'Thông số xe' : 'Car specification'}
            </h2>
          </div>
          {specs ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Spec
                icon={<Weight />}
                label={lang === 'vi' ? 'Khối lượng tối thiểu' : 'Minimum weight'}
                value={`${specs.minWeightKg} kg`}
              />
              <Spec
                icon={<Gauge />}
                label={lang === 'vi' ? 'Cấu hình động cơ' : 'Engine configuration'}
                value={specs.engineConfig}
              />
              <Spec
                icon={<Gauge />}
                label={lang === 'vi' ? 'Dung tích' : 'Displacement'}
                value={`${specs.displacementLiters} L`}
              />
              <Spec
                icon={<Settings2 />}
                label={lang === 'vi' ? 'Hộp số' : 'Gearbox'}
                value={specs.gearbox}
              />
              <Spec
                icon={<Ruler />}
                label={lang === 'vi' ? 'Kích thước bánh xe' : 'Wheel size'}
                value={`${specs.wheelSizeInch} in`}
              />
              <Spec
                icon={<Gauge />}
                label={lang === 'vi' ? 'Dung lượng nhiên liệu' : 'Fuel capacity'}
                value={`${specs.fuelCapacityKg} kg`}
              />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-studio-300 bg-white p-5 text-sm text-studio-600">
              {lang === 'vi'
                ? 'Thông số kỹ thuật chi tiết chưa được xác minh cho mẫu xe này.'
                : 'Detailed technical specifications have not been verified for this car.'}
            </p>
          )}
          {specs && (
            <p className="text-[11px] text-studio-500">
              {lang === 'vi'
                ? 'Thông số được hiển thị theo dữ liệu mẫu của dự án.'
                : 'Specifications are shown as provided in the project dataset.'}
            </p>
          )}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl bg-studio-950 p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-f1red">
              {lang === 'vi' ? 'Đội ngũ phát triển' : 'Engineering'}
            </p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase">
              {lang === 'vi' ? 'Thông tin xe' : 'Car details'}
            </h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-studio-400">
                  {lang === 'vi' ? 'Nhà thiết kế' : 'Designer'}
                </dt>
                <dd className="mt-1 font-bold">
                  {car.designer || (lang === 'vi' ? 'Chưa có dữ liệu' : 'Not available')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-studio-400">
                  {lang === 'vi' ? 'Đơn vị động lực' : 'Power unit'}
                </dt>
                <dd className="mt-1 font-bold">{car.powerUnit}</dd>
              </div>
              <div>
                <dt className="text-xs text-studio-400">{lang === 'vi' ? 'Tay đua' : 'Drivers'}</dt>
                <dd className="mt-1 space-y-1 font-bold">
                  {car.drivers.map((driver) => (
                    <span className="block" key={driver}>
                      {driver}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-f1red">
                Engineering notes
              </p>
              <h2 className="font-display text-2xl font-black uppercase sm:text-3xl">
                {lang === 'vi' ? 'Điểm kỹ thuật' : 'Technical highlights'}
              </h2>
            </div>
            <div className="divide-y divide-studio-200 rounded-2xl border border-studio-200 bg-white px-5 shadow-subtle">
              {highlights.map(([label, value]) => (
                <div key={label} className="py-4">
                  <h3 className="text-xs font-black uppercase tracking-wide text-studio-500">
                    {label}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-studio-800">{value}</p>
                </div>
              ))}
              {!highlights.length && (
                <p className="py-4 text-sm text-studio-500">
                  {lang === 'vi'
                    ? 'Chưa có ghi chú kỹ thuật đã xác minh.'
                    : 'No verified technical notes available.'}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Spec: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-2xl border border-studio-200 bg-white p-5 shadow-subtle">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-f1red/10 text-f1red">
      {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
    </span>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-studio-400">{label}</p>
    <p className="mt-1 text-sm font-bold leading-relaxed text-studio-900">{value}</p>
  </div>
);
