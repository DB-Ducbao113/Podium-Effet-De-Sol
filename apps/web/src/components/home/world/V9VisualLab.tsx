import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorldLabMode } from './worldModel';
import { HomeWorldHost } from './HomeWorldHost';

const studies = {
  pressure: {
    title: '01 / PRESSURE MEMBRANE',
    description: 'Two translucent shader-displaced fabrics. Move your pointer to perturb the local surface; watch the bright edge and traveling ridge follow the geometry.',
  },
  velocity: {
    title: '02 / VELOCITY FIELD',
    description: 'Deep curved aerodynamic tubes with an animated flow shader. The pointer bends the streamlines rather than moving an HTML image.',
  },
  carbon: {
    title: '03 / CARBON ARCHITECTURE',
    description: 'Bevelled carbon aerofoils drawn with one instanced mesh. The spatial composition changes shape across the narrative.',
  },
} as const;

/** Developer-only route; lab is art approval, not a production home replacement. */
export function V9VisualLab() {
  const [mode, setMode] = useState<Exclude<WorldLabMode, null>>('pressure');
  const selected = studies[mode];

  return (
    <section className="v9-lab" data-v9-lab={mode} aria-labelledby="v9-lab-heading">
      <HomeWorldHost mode="lab" lab={mode} />
      <div className="v9-lab__layout">
        <span className="v9-lab__eyebrow">PODIUM EDS / V9-01 / VISUAL LABORATORY</span>
        <h1 id="v9-lab-heading" className="v9-lab__title">
          THE LIVING<br /><em>MACHINE.</em>
        </h1>
        <p className="v9-lab__lead">
          Three original procedural 3D studies. Choose a material, move your pointer
          and examine how its shape reacts. This is a visual development environment,
          not a physical CFD simulation.
        </p>
        <div className="v9-lab__select" role="group" aria-label="Choose a visual material">
          {([
            ['pressure', '01 / PRESSURE'],
            ['velocity', '02 / VELOCITY'],
            ['carbon', '03 / CARBON'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="v9-lab__detail" aria-live="polite">
          <div>
            <small>{selected.title}</small>
            <p>{selected.description}</p>
          </div>
          <Link className="v9-lab__link" to="/?v9=1">VIEW FULL HOMEPAGE →</Link>
        </div>
      </div>
    </section>
  );
}
