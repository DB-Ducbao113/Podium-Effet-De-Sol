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
  { id: 'engineering', to: insideMachineTrialEnabled ? '/engineering' : '/engineering/car-anatomy', label: lang === 'vi' ? 'Kỹ thuật' : 'Engineering', icon: BookOpen, children: insideMachineTrialEnabled ? [
    { id: 'inside-machine', label: 'Inside the Machine', to: '/engineering' },
    { id: 'insights', label: lang === 'vi' ? 'Bài viết kỹ thuật' : 'Engineering insights', to: '/engineering/insights' },
    { id: 'previous-anatomy', label: lang === 'vi' ? 'Giải phẫu xe cũ' : 'Previous car anatomy', to: '/engineering/car-anatomy' },
  ] : [
    { id: 'car-anatomy', label: lang === 'vi' ? 'Giải phẫu xe' : 'Car anatomy', to: '/engineering/car-anatomy' },
    { id: 'front-wing', label: lang === 'vi' ? 'Cánh trước' : 'Front wing', to: '/engineering/car-anatomy?chapter=front-wing' },
    { id: 'floor', label: lang === 'vi' ? 'Sàn xe' : 'Floor', to: '/engineering/car-anatomy?chapter=floor' },
    { id: 'diffuser', label: lang === 'vi' ? 'Bộ khuếch tán' : 'Diffuser', to: '/engineering/car-anatomy?chapter=diffuser' },
    { id: 'rear-wing', label: lang === 'vi' ? 'Cánh sau' : 'Rear wing', to: '/engineering/car-anatomy?chapter=rear-wing' },
  ] },
  ];
};
