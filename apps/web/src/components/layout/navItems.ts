import { BookOpen, Flag, Home, Shield, Trophy, Users } from 'lucide-react';

export type NavItemChild = { id: string; label: string; to: string };
export type NavItem = { id: string; label: string; to: string; icon: typeof Home; children?: NavItemChild[] };

export const buildNavItems = (lang: 'vi' | 'en', insideMachineTrialEnabled: boolean, season: 2024 | 2025 | 2026 = 2026): NavItem[] => {
  const SEASON_PATH = `/season/${season}`;
  return [
  { id: 'overview', to: '/', label: lang === 'vi' ? 'Tổng quan' : 'Overview', icon: Home },
  { id: 'results', to: `${SEASON_PATH}?tab=results`, label: lang === 'vi' ? 'Kết quả' : 'Results', icon: Flag, children: [
    { id: 'race-results', label: lang === 'vi' ? 'Kết quả chặng' : 'Race results', to: `${SEASON_PATH}?tab=results` },
    { id: 'calendar', label: lang === 'vi' ? 'Lịch thi đấu' : 'Calendar', to: `${SEASON_PATH}?tab=calendar` },
  ] },
  { id: 'standings', to: `${SEASON_PATH}?tab=standings`, label: lang === 'vi' ? 'Xếp hạng' : 'Standings', icon: Trophy, children: [
    { id: 'driver-standings', label: lang === 'vi' ? 'Xếp hạng tay đua' : "Drivers' championship", to: `${SEASON_PATH}?tab=standings&category=drivers` },
    { id: 'constructor-standings', label: lang === 'vi' ? 'Xếp hạng đội đua' : "Constructors' championship", to: `${SEASON_PATH}?tab=standings&category=constructors` },
  ] },
  { id: 'drivers', to: '/drivers', label: lang === 'vi' ? 'Tay đua' : 'Drivers', icon: Users },
  { id: 'teams', to: '/teams', label: lang === 'vi' ? 'Đội đua' : 'Teams', icon: Shield },
  { id: 'engineering', to: '/engineering', label: lang === 'vi' ? 'Kỹ thuật' : 'Engineering', icon: BookOpen, children: insideMachineTrialEnabled ? [
    { id: 'inside-machine', label: 'Inside the Machine', to: '/engineering' },
  ] : undefined },
  ];
};

// The horizontal bar shows the same destinations in the same order everywhere it
// is rendered, so a page that draws its own menu bar cannot drift from the site.
export const buildDesktopNavItems = (items: NavItem[], lang: 'vi' | 'en'): NavItem[] => {
  const overview = items.find((item) => item.id === 'overview')!;
  const results = items.find((item) => item.id === 'results')!;
  const standings = items.find((item) => item.id === 'standings')!;
  const engineering = items.find((item) => item.id === 'engineering')!;
  const teams = items.find((item) => item.id === 'teams')!;
  const drivers = items.find((item) => item.id === 'drivers')!;
  return [
    { ...overview, label: lang === 'vi' ? 'Trang chủ' : 'Home' },
    results,
    standings,
    { id: 'showroom', label: 'Showroom', to: '/showroom', icon: overview.icon },
    engineering,
    teams,
    drivers,
  ];
};
