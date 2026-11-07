#!/usr/bin/env python3
"""P2.1 STEP B-Rep intake: local-only technical evidence, never license clearance.

Example:
  python tools/cad-first/p2_1_step_intake.py \
    --step .local-assets/cad-first/candidates/CornerLF_Complete.STEP \
    --source-id ludemann-f1000-corner-lf \
    --registry apps/web/src/dev/cadFirstP2/sourceRegistry.json \
    --report .local-assets/cad-first/reviews/ludemann-front-left.json

Use --metadata-only to inspect Part 21 text without CadQuery. This does not
prove STEP solids are valid. No GLB export or network access is performed.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Any

MAX_BYTES = 250 * 1024 * 1024
PRODUCT_RE = re.compile(r"\bPRODUCT\s*\(\s*'((?:[^']|'')*)'", re.IGNORECASE)
ENTITY_RE = re.compile(
    r"\b(MANIFOLD_SOLID_BREP|ADVANCED_FACE|CLOSED_SHELL|NEXT_ASSEMBLY_USAGE_OCCURRENCE)\s*\(",
    re.IGNORECASE,
)
CATEGORIES = {
    "rim_tyre": (r"\brim\b", r"\bwheel\b", r"\btyre\b", r"\btire\b"),
    "hub": (r"\bhub\b",),
    "upright": (r"\bupright\b", r"\bknuckle\b", r"\bspindle\b"),
    "brake_rotor": (r"\brotor\b", r"\bbrake\s*disc\b", r"\bdisc\b"),
    "caliper": (r"\bcaliper\b",),
    "bearing": (r"\bbearing\b", r"\brace\b"),
    "fastener": (r"\bbolt\b", r"\bnut\b", r"\bwasher\b", r"\bstud\b", r"\bscrew\b"),
    "suspension": (r"\bpush\s*rod\b", r"\bpushrod\b", r"\barm\b",
                   r"\bwishbone\b", r"\btie\s*rod\b", r"\brod\s*end\b"),
}


def get_candidate(registry: Path | None, source_id: str) -> dict[str, Any] | None:
    if registry is None:
        return None
    data = json.loads(registry.read_text(encoding="utf-8"))
    if data.get("schema") != "podium-eds.p2.cad-first.sources.v1":
        raise ValueError("Candidate registry schema mismatch")
    matches = [x for x in data.get("candidates", []) if x.get("id") == source_id]
    if len(matches) != 1:
        raise ValueError("Unregistered source ID; do not bypass copyright review")
    return matches[0]


def inspect_step(
    path: Path,
    source_id: str,
    registry: Path | None = None,
    metadata_only: bool = False,
) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(path)
    size = path.stat().st_size
    if size < 120 or size > MAX_BYTES:
        raise ValueError("Invalid STEP size (minimum 120 B, maximum 250 MiB)")
    with path.open("rb") as stream:
        head = stream.read(min(size, 256))
    if head.startswith(b"version https://git-lfs.github.com/spec/v1"):
        raise ValueError("Git LFS pointer is not CAD geometry; fetch the real LFS object")
    if not head.lstrip().startswith(b"ISO-10303-21;"):
        raise ValueError("Not an ISO 10303 STEP Part 21 file")
    raw = path.read_bytes()
    source = raw.decode("latin-1")
    digest = hashlib.sha256(raw).hexdigest()
    products = sorted({
        name.replace("''", "'").strip()
        for name in PRODUCT_RE.findall(source) if name.strip()
    })
    counts = {kind: 0 for kind in (
        "MANIFOLD_SOLID_BREP", "ADVANCED_FACE", "CLOSED_SHELL",
        "NEXT_ASSEMBLY_USAGE_OCCURRENCE"
    )}
    for match in ENTITY_RE.finditer(source):
        counts[match.group(1).upper()] += 1
    evidence = {}
    for category, patterns in CATEGORIES.items():
        evidence[category] = [
            name for name in products
            if any(re.search(pattern, re.sub(r"[_-]", " ", name), re.I)
                   for pattern in patterns)
        ]
    candidate = get_candidate(registry, source_id)
    report: dict[str, Any] = {
        "schema": "podium-eds.p2.cad-first.intake.v1",
        "sourceId": source_id,
        "file": path.name,
        "fileBytes": size,
        "sha256": digest,
        "stepEntityCounts": counts,
        "namedProductCount": len(products),
        "namedProducts": products[:150],
        "evidenceByNameOnly": evidence,
        "geometricInspection": "NOT PERFORMED",
        "cadSolids": None,
        "solids": [],
        "status": "REVIEW",
        "rightsStatus": candidate.get("rightsStatus", "NO LICENSE EVIDENCE") if candidate else "NO LICENSE EVIDENCE",
        "publicDistributionAllowed": False,
        "notCertified": [
            "physical fit", "mating tolerance", "thread engagement",
            "Formula 1 provenance", "commercial distribution"
        ],
    }
    if metadata_only:
        report["status"] = "STEP STRUCTURE ONLY — NOT VALIDATED B-REP"
        return report
    try:
        import cadquery as cq
    except ImportError as exc:
        raise RuntimeError("CadQuery is required for real solid geometry inspection") from exc
    shape = cq.importers.importStep(str(path))
    solids = shape.solids().vals()
    if not solids:
        raise ValueError("No importable B-Rep solids")
    invalid = []
    total_volume = 0.0
    bounds = []
    for i, solid in enumerate(solids):
        box = solid.BoundingBox()
        extent = [[box.xmin, box.ymin, box.zmin], [box.xmax, box.ymax, box.zmax]]
        volume = solid.Volume()
        valid = (
            not solid.isNull() and solid.isValid() and volume > 0
            and all(math.isfinite(v) for row in extent for v in row)
        )
        if not valid:
            invalid.append(i)
        total_volume += max(0, volume)
        bounds.append(extent)
        if i < 150:
            report["solids"].append({
                "index": i,
                "volumeSourceUnitsCubed": round(volume, 6),
                "faces": len(solid.Faces()),
                "boundsSourceUnits": [
                    [round(v, 4) for v in row] for row in extent
                ],
                "valid": valid,
            })
    report["cadSolids"] = len(solids)
    report["invalidSolids"] = invalid
    report["totalVolumeSourceUnitsCubed"] = round(total_volume, 3)
    report["boundsSourceUnits"] = [
        [min(b[0][i] for b in bounds) for i in range(3)],
        [max(b[1][i] for b in bounds) for i in range(3)],
    ]
    report["geometricInspection"] = "B-REP IMPORTED VIA CADQUERY / OPENCASCADE"
    report["status"] = (
        "CAD TECHNICAL PREFLIGHT PASS"
        if not invalid and len(solids) >= 2
        else "PARTIAL — TECHNICAL REASSESSMENT REQUIRED"
    )
    return report


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--step", required=True, type=Path)
    cli.add_argument("--source-id", required=True)
    cli.add_argument("--registry", type=Path)
    cli.add_argument("--report", type=Path)
    cli.add_argument("--metadata-only", action="store_true")
    args = cli.parse_args()
    result = inspect_step(args.step, args.source_id, args.registry, args.metadata_only)
    data = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(data, encoding="utf-8")
    print(data)
