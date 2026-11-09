import React from 'react';
import type { createLiveryRuntime } from './liveryRuntime';
import type { TeamLivery } from './teamLiveries';
import type { SurfaceAnchorMap } from './liveryDefinitions';
import type { CameraPreset } from '../../components/showroom/CameraController';
import { STANDARD_2026_REFERENCE_SETS } from './standard2026References';
import './author.css';

type AuthorApi = ReturnType<typeof createLiveryRuntime>['author'];
const images = import.meta.glob<string>('../reference-assets/*-2026-official-right.webp', { eager: true, query: '?url', import: 'default' });

export function AuthorPanel({ api, team, onTeam, onCamera }: { api: AuthorApi | null; team: TeamLivery; onTeam: (id: string) => void; onCamera: (preset: CameraPreset) => void }) {
  const [revision, refresh] = React.useReducer((value) => value + 1, 0);
  const [error, setError] = React.useState('');
  const [diagnostic, setDiagnostic] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  React.useEffect(() => { const timer = window.setInterval(refresh, 400); return () => window.clearInterval(timer); }, []);
  void revision;
  const entries = api?.entries() ?? [];
  const selected = api?.selected() ?? entries[0]?.id;
  const current = entries.find((item) => item.id === selected);
  const anchor = current?.anchor;
  const edit = (patch: Partial<SurfaceAnchorMap>) => { if (current && api?.updateAnchor(current.id, patch)) refresh(); };
  const exportFile = () => {
    if (!api) return;
    const blob = new Blob([api.exportConfig()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'P6_2026_DECAL_PLACEMENTS.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  // Do not substitute Cadillac's updated midseason artwork for the frozen debut.
  const reference = images[`../reference-assets/${team.id}-2026-official-right.webp`];
  return <aside className="author-panel" aria-label="P6 decal authoring tool">
    <h2>3D DECAL AUTHORING <small>DEV ONLY</small></h2>
    <p>Drag on Model B to orbit at any time. Hold Shift while clicking/dragging to move the selected decal (DEV only).</p>
    <label>Team <select value={team.id} onChange={(event) => onTeam(event.target.value)}>{['mclaren','ferrari','mercedes','redbull','racingbulls','astonmartin','alpine','williams','haas','audi','cadillac'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
    {reference && <a href={STANDARD_2026_REFERENCE_SETS[team.id as keyof typeof STANDARD_2026_REFERENCE_SETS].galleryUrl} target="_blank" rel="noreferrer"><img className="author-reference" src={reference} alt={`Official 2026 ${team.name} right profile reference`} /></a>}
    <p>Reference: 2026 F1 imagery. Photo is for alignment only.</p>
    <label>Mark <select value={selected ?? ''} onChange={(event) => { api?.select(event.target.value); refresh(); }}><option value="" disabled>Select decal</option>{entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.id} · {entry.artwork}</option>)}</select></label>
    <div className="author-actions" aria-label="Authoring cameras">{(['front','side','rear','top','overview'] as const).map((view) => <button key={view} onClick={() => onCamera(view)}>{view === 'overview' ? 'Hero' : view}</button>)}</div>
    {current && anchor && <>
      <div className="author-readout">{anchor.side.toUpperCase()} · mesh {anchor.meshName || 'paint body'}<br/>x {(anchor.x ?? 0).toFixed(3)} · y {anchor.y.toFixed(3)} · z {anchor.z.toFixed(3)}<br/>w {anchor.width.toFixed(3)} · h {anchor.height.toFixed(3)} · rot {anchor.rotation.toFixed(2)} · offset {anchor.offset.toFixed(3)}</div>
      <div className="author-sliders">
        {(['y','z','width','height','rotation','offset'] as const).map((field) => <label key={field}>{field}<input type="range" min={field === 'z' ? -2 : field === 'rotation' ? -3.14 : field === 'offset' ? 0 : field === 'y' ? 0 : .05} max={field === 'z' ? 2 : field === 'rotation' ? 3.14 : field === 'offset' ? .04 : field === 'y' ? 1.1 : 1} step={field === 'offset' ? .001 : .01} value={anchor[field]} onChange={(event) => edit({ [field]: Number(event.target.value) })} /></label>)}
      </div>
      <div className="author-actions"><label>Side <select value={anchor.side} onChange={(event) => edit({ side: event.target.value as SurfaceAnchorMap['side'] })}><option>left</option><option>right</option><option>top</option></select></label><button onClick={() => edit({ visible: anchor.visible === false })}>{anchor.visible === false ? 'Show' : 'Hide'}</button><button onClick={() => edit({ locked: !anchor.locked })}>{anchor.locked ? 'Unlock' : 'Lock'}</button></div>
      <p className="author-gap">{current.discrepancy}</p>
    </>}
    <div className="author-actions"><button onClick={() => { api?.undo(); refresh(); }}>Undo</button><button onClick={() => { api?.redo(); refresh(); }}>Redo</button><button onClick={() => { api?.diagnostics(!diagnostic); setDiagnostic(!diagnostic); }}>{diagnostic ? 'Hide UV grid' : 'UV/mesh diagnostic'}</button></div>
    {diagnostic && <><p>Paint projection: red = left, blue = right, green = top. Grid marks generated UV regions; Model B source UVs are listed below.</p>{api?.atlasPreview() && <img className="author-reference" src={api.atlasPreview()} alt="Transparent decal atlas and alpha preview" />}<details><summary>Model B mesh and UV inventory</summary>{api?.meshReport().map((item) => <p key={item.name}>{item.name} · {item.material} · {item.vertices} vertices · UV {item.uv ? 'yes' : 'no'}</p>)}</details></>}
    <div className="author-actions"><button onClick={exportFile}>Export JSON</button><button onClick={() => { const overrides = JSON.parse(localStorage.getItem('p6-2026-author-overrides-v1') || '{}') as Record<string, SurfaceAnchorMap>; setDraft(JSON.stringify({ version: 1, overrides }, null, 2)); }}>Load saved</button></div>
    <label>Import placement JSON<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Paste exported config" /></label><button onClick={() => { try { api?.importConfig(draft); setError(''); refresh(); } catch (cause) { setError(String(cause)); } }}>Import</button>
    {error && <p role="alert">{error}</p>}
  </aside>;
}
