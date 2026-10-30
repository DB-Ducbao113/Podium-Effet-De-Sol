import type { Lang } from './types';

const LABELS: Record<string, Record<Lang, string>> = {
  source_island: { en: 'Original Model B surface', vi: 'Bề mặt Model B gốc' },
  frozen_model_b_connected_shell_faces_reassigned_to_single_owner: { en: 'Model B source-derived shell', vi: 'Vỏ thân dẫn xuất từ Model B gốc' },
  mixed_original_and_new: { en: 'Mixed Model B source and authored detail', vi: 'Kết hợp Model B gốc và chi tiết tự dựng' },
  newly_authored: { en: 'Illustrative authored component', vi: 'Linh kiện minh họa tự dựng' },
  newly_authored_closed_geometry_from_model_b_envelope: { en: 'Illustrative shell reconstructed from Model B envelope', vi: 'Vỏ minh họa dựng theo biên dạng Model B' },
  r4_3_authored_illustrative_mechanical_system: { en: 'Illustrative authored mechanical system', vi: 'Hệ cơ khí minh họa tự dựng' },
};

export function componentProvenance(provenance: string | undefined, lang: Lang): string {
  return provenance && LABELS[provenance] ? LABELS[provenance][lang] : (lang === 'vi' ? 'Nguồn gốc chưa xác minh' : 'Provenance unverified');
}
