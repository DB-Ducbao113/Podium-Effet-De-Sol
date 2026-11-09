import React from 'react';
import type { CameraPreset } from '../../components/showroom/CameraController';
import type { PrecisionTeam } from './paintAtlas';
import { MODEL_B_COMPONENT_GROUPS } from './modelBComponentMap';
import { getPaintLayoutCounts, getPaintLayoutReview } from './paintLayoutReview';
import { STANDARD_2026_REFERENCE_SETS } from './standard2026References';

type Props = {
  teamId: PrecisionTeam;
  referenceUrl?: string;
  belgiumStudy?: boolean;
  showBranding: boolean;
  onShowBranding: (show: boolean) => void;
  onCamera: (preset: CameraPreset) => void;
};

const statusLabel = {
  'reference-confirmed-gap': 'SOURCE-DOCUMENTED LAYOUT GAP',
  'code-geometry-risk': 'CODE GEOMETRY RISK',
  'photo-review-required': 'PHOTO/GLB COMPARISON NEEDED',
} as const;

/**
 * This panel is intentionally metadata-only. It never raycasts, loads geometry
 * or alters shaders on every render, so reviewing 30 components stays cheap.
 */
export function ModelBPaintLayoutInspector({ teamId, referenceUrl, belgiumStudy = false, showBranding, onShowBranding, onCamera }: Props) {
  const [selected, setSelected] = React.useState('sidepod-inlet-lip');
  const reviews = React.useMemo(() => getPaintLayoutReview(teamId), [teamId]);
  const counts = React.useMemo(() => getPaintLayoutCounts(teamId), [teamId]);
  const active = reviews.find((item) => item.group.id === selected) ?? reviews[0];
  const gallery = referenceUrl ?? STANDARD_2026_REFERENCE_SETS[teamId].galleryUrl;

  const lookAtSide = (side: 'left' | 'right') => {
    const devView = (window as Window & {
      __P6_VIEW__?: (side: 'left' | 'right') => void;
    }).__P6_VIEW__;
    if (devView) devView(side);
    else onCamera('side');
  };

  return (
    <div className="advanced-group component-review">
      <h3>Paint layout · component audit</h3>
      <p className="component-review-disclaimer">
        30 design groups / 54 physical surfaces. Sponsor artwork is a provisional DEV preview where available.
        All mesh-to-part mappings are provisional pending actual Model B inspection.
        {belgiumStudy && ' Findings below describe the February launch baseline; Belgium part-by-part comparison is pending.'}
      </p>
      <div className="component-review-totals" aria-label="Paint layout audit counts">
        <span>{counts.confirmedGaps} documented gaps</span>
        <span>{counts.codeRisks} code risks</span>
        <span>{counts.photoNeeded} photo checks</span>
        <strong>0 accepted</strong>
      </div>
      <label className="component-review-picker">
        Inspect a separate paint region
        <select value={active.group.id} onChange={(event) => setSelected(event.target.value)}>
          {MODEL_B_COMPONENT_GROUPS.map((group) => (
            <option key={group.id} value={group.id}>
              {group.priority === 'critical' ? '★ ' : ''}{group.title}
            </option>
          ))}
        </select>
      </label>
      <div className="component-review-detail">
        <div className="component-review-heading">
          <strong>{active.group.title}</strong>
          <small>{active.group.priority.toUpperCase()} PRIORITY</small>
        </div>
        <p>{active.group.designNotes}</p>
        <p><strong>Current status:</strong> {statusLabel[active.status]}</p>
        <p>{active.finding?.summary ??
          'Not individually assessed yet. Check the physical left/right surfaces, compare with same-version photos and inspect the Model B mesh.'}
        </p>
        <p><strong>Surfaces:</strong> {active.group.sides.join(' · ')}
          {' · '}<strong>Sponsor potential:</strong> {active.group.sponsorSuitability}
        </p>
        <p><strong>Required photos:</strong> {active.group.referenceAngles.join(', ')}</p>
        {active.finding?.sourceUrl && (
          <a href={active.finding.sourceUrl} target="_blank" rel="noopener noreferrer">
            Supporting design source
          </a>
        )}
      </div>
      <div className="component-review-cameras" aria-label="Component comparison camera angles">
        <button type="button" onClick={() => lookAtSide('left')}>Left</button>
        <button type="button" onClick={() => lookAtSide('right')}>Right</button>
        <button type="button" onClick={() => onCamera('front')}>Front</button>
        <button type="button" onClick={() => onCamera('rear')}>Rear</button>
        <button type="button" onClick={() => onCamera('top')}>Top</button>
      </div>
      <label className="component-review-branding">
        <input type="checkbox" checked={showBranding}
          onChange={(event) => onShowBranding(event.target.checked)} />
        Show existing sponsor/wordmark overlays
      </label>
      <p className="component-review-disclaimer">
        Paint-only is recommended for layout QA. It hides review sponsor decals; tyre-sidewall lettering and team-name study marks remain visible.
        it does not change the chassis mesh or claim the livery is approved.
        <a href={gallery} target="_blank" rel="noopener noreferrer"> View photo reference</a>
      </p>
    </div>
  );
}
