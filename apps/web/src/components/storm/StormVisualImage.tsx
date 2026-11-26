import { useState } from "react";
import type { SeasonYear } from "../../types";
import {
  resolveStormVisualAsset,
  type StormVisualKind,
} from "./stormVisualAssets";

export interface StormVisualImageProps {
  readonly kind: StormVisualKind;
  readonly season: SeasonYear;
  readonly entityId: string;
  readonly alt: string;
  readonly className: string;
  readonly placeholder: string;
  /** Keep card faces clean by default (`BR-02`); optional note inside Dossier views. */
  readonly showProvenanceNote?: boolean;
  readonly loading?: "lazy" | "eager";
}

export function StormVisualImage({
  kind,
  season,
  entityId,
  alt,
  className,
  placeholder,
  showProvenanceNote = false,
  loading = "lazy",
}: StormVisualImageProps) {
  const asset = resolveStormVisualAsset(kind, season, entityId);
  const key = `${kind}:${season}:${entityId}`;
  const [failure, setFailure] = useState<
    { key: string; level: 1 | 2 } | undefined
  >();
  const level = failure?.key === key ? failure.level : 0;
  const src =
    level === 0 ? asset.src : level === 1 ? asset.fallbackSrc : undefined;
  const source =
    level === 1
      ? "existing-season-portrait"
      : level > 1
        ? "missing"
        : asset.source;

  return (
    <figure
      className={className}
      data-storm-visual-kind={kind}
      data-storm-visual-season={season}
      data-storm-visual-id={entityId}
      data-storm-visual-source={source}
    >
      {src ? (
        <img
          key={`${key}:${level}`}
          src={src}
          alt={alt}
          width={asset.width}
          height={asset.height}
          loading={loading}
          decoding="async"
          onError={() => {
            setFailure({
              key,
              level: level === 0 && asset.fallbackSrc ? 1 : 2,
            });
          }}
        />
      ) : (
        <span className="sp-visual-placeholder" role="img" aria-label={alt}>
          <span aria-hidden="true">{placeholder}</span>
        </span>
      )}
      {showProvenanceNote ? (
        <figcaption className="sp-provenance-caption">
          {asset.provenanceNote}
        </figcaption>
      ) : null}
    </figure>
  );
}
