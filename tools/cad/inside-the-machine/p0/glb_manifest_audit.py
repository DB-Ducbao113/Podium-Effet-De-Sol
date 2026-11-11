#!/usr/bin/env python3
"""Read-only GLB structure audit for Podium EDS Inside the Machine P0.

Uses the GLB JSON chunk only; no decompression or geometry mutation.
Outputs a JSON report + Markdown summary to an explicitly chosen local directory.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import struct
from pathlib import Path
from datetime import datetime, timezone

GLB_MAGIC = b"glTF"
JSON_CHUNK = b"JSON"
SEMANTIC_TERMS = {
    "front_wing": ("front", "wing"),
    "front_left_wheel": ("front", "left", "wheel|tyre|tire|rim"),
    "rear_wing": ("rear", "wing"),
}


def load_glb(path: Path):
    with path.open("rb") as f:
        hdr = f.read(12)
        if len(hdr) != 12:
            raise ValueError("GLB header is too short")
        magic, version, length = struct.unpack("<4sII", hdr)
        if magic != GLB_MAGIC or version != 2:
            raise ValueError("Expected GLB v2 file")
        actual = path.stat().st_size
        if length != actual:
            raise ValueError(f"Declared GLB length {length} != actual {actual}")
        json_chunk = None
        chunk_summary = []
        consumed = 12
        while consumed < length:
            header = f.read(8)
            if len(header) != 8:
                raise ValueError("Truncated chunk header")
            chunk_length, chunk_type = struct.unpack("<I4s", header)
            consumed += 8 + chunk_length
            if consumed > length:
                raise ValueError("Chunk exceeds GLB length")
            chunk_summary.append({"type": chunk_type.decode("ascii", "replace"), "bytes": chunk_length})
            if chunk_type == JSON_CHUNK:
                if json_chunk is not None:
                    raise ValueError("Multiple JSON chunks")
                json_chunk = f.read(chunk_length)
            else:
                f.seek(chunk_length, 1)
        if not json_chunk:
            raise ValueError("No JSON chunk")
        return json.loads(json_chunk.rstrip(b" \x00\t\n\r")), chunk_summary


def primitive_triangles(primitive, accessors):
    mode = primitive.get("mode", 4)
    if mode != 4:  # 4 = TRIANGLES
        return None
    idx = primitive.get("indices")
    if idx is not None and 0 <= idx < len(accessors):
        return accessors[idx].get("count", 0) // 3
    attrs = primitive.get("attributes", {})
    pos = attrs.get("POSITION")
    if pos is not None and 0 <= pos < len(accessors):
        return accessors[pos].get("count", 0) // 3
    return None


def matches_semantic(name, tokens):
    norm = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
    return all(any(re.search(rf"\b{re.escape(x)}\b", norm) for x in token.split("|")) for token in tokens)


def audit(path: Path, expected_sha: str | None):
    gltf, chunks = load_glb(path)
    with path.open("rb") as src:
        digest = hashlib.file_digest(src, "sha256").hexdigest().upper()
    meshes = gltf.get("meshes", [])
    nodes = gltf.get("nodes", [])
    materials = gltf.get("materials", [])
    accessors = gltf.get("accessors", [])
    nodes_with_mesh = [i for i, n in enumerate(nodes) if "mesh" in n]
    primitive_total = sum(len(m.get("primitives", [])) for m in meshes)
    triangle_counts = [primitive_triangles(p, accessors) for m in meshes for p in m.get("primitives", [])]
    report = {
        "audit_kind": "GLB_JSON_ONLY_NOT_GEOMETRY_VALIDATION",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "file": str(path.resolve()),
        "bytes": path.stat().st_size,
        "sha256": digest,
        "expected_sha256": expected_sha.upper() if expected_sha else None,
        "hash_match": (digest == expected_sha.upper()) if expected_sha else None,
        "extensions_used": gltf.get("extensionsUsed", []),
        "extensions_required": gltf.get("extensionsRequired", []),
        "scenes": len(gltf.get("scenes", [])),
        "nodes": len(nodes),
        "nodes_with_mesh": len(nodes_with_mesh),
        "mesh_definitions": len(meshes),
        "mesh_primitives": primitive_total,
        "materials": len(materials),
        "accessors": len(accessors),
        "estimated_triangles_from_accessors": sum(v or 0 for v in triangle_counts),
        "primitives_with_unknown_triangles": sum(v is None for v in triangle_counts),
        "chunks": chunks,
        "mesh_summary": [],
        "semantic_name_matches": {},
        "warnings": [],
    }
    for ni, node in enumerate(nodes):
        mi = node.get("mesh")
        if mi is None or mi < 0 or mi >= len(meshes):
            continue
        mesh = meshes[mi]
        mat_names = []
        tris = 0
        for primitive in mesh.get("primitives", []):
            mati = primitive.get("material")
            mat_names.append(materials[mati].get("name", f"material_{mati}") if isinstance(mati, int) and 0 <= mati < len(materials) else "[no material]")
            tris += primitive_triangles(primitive, accessors) or 0
        report["mesh_summary"].append({
            "node_index": ni,
            "node_name": node.get("name", f"node_{ni}"),
            "mesh_index": mi,
            "mesh_name": mesh.get("name", f"mesh_{mi}"),
            "primitives": len(mesh.get("primitives", [])),
            "estimated_triangles": tris,
            "materials": sorted(set(mat_names)),
            "position": node.get("translation"),
            "rotation": node.get("rotation"),
            "scale": node.get("scale"),
            "has_matrix": "matrix" in node,
        })
    for name, parts in SEMANTIC_TERMS.items():
        matches = [m["node_name"] for m in report["mesh_summary"] if matches_semantic(m["node_name"] + " " + m["mesh_name"], parts)]
        report["semantic_name_matches"][name] = matches
    if any(x in report["extensions_required"] for x in ("EXT_meshopt_compression", "KHR_meshopt_compression")):
        report["warnings"].append("Meshopt required: Blender may need a decoded working copy; do not alter the source GLB")
    if report["nodes_with_mesh"] <= 1:
        report["warnings"].append("<= 1 mesh-bearing node: semantic splitting cannot be assumed from material/primitive count")
    if report["hash_match"] is False:
        report["warnings"].append("Source hash differs from the repository provenance record; STOP and verify candidate identity")
    report["warnings"].append("JSON-only audit cannot establish disconnected topology, correct part boundaries, or snap-back accuracy")
    return report


def markdown(report):
    rows = [
        "# Inside the Machine — P0 GLB Manifest Audit",
        "", "**Status: EVIDENCE ONLY — NOT GO for P1 until manual visual/topology validation.**", "",
        f"- Source: `{report['file']}`",
        f"- Size: {report['bytes']:,} bytes",
        f"- SHA-256: `{report['sha256']}`",
        f"- Provenance match: `{report['hash_match']}`",
        f"- glTF nodes / mesh-bearing nodes / mesh definitions / primitives: **{report['nodes']} / {report['nodes_with_mesh']} / {report['mesh_definitions']} / {report['mesh_primitives']}**",
        f"- Estimated triangles (per mesh definition, not instance total): **{report['estimated_triangles_from_accessors']:,}**",
        f"- Materials: **{report['materials']}**",
        f"- Extensions required: `{', '.join(report['extensions_required']) or 'none'}`",
        "", "## Three target part-name signals", "",
    ]
    for label, matches in report["semantic_name_matches"].items():
        rows.append(f"- `{label}`: {', '.join(matches) if matches else '**NOT IDENTIFIED BY NODE NAME**'}")
    rows += ["", "## Risks and limitations", ""]
    rows += [f"- {x}" for x in report["warnings"]]
    rows += ["", "## Next gate", "", "Inspect the real topology in Blender or the verified source `.blend`; demonstrate semantic separation of front wing, front-left wheel, and rear wing. No auto-split based on material alone. Photograph/render before, exploded, reassembled; compare original transforms and silhouettes. Stop at OWNER REVIEW.", ""]
    return "\n".join(rows)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--expected-sha", help="Expected SHA-256 from docs/asset-licenses.md")
    a = p.parse_args()
    if not a.model.is_file():
        p.error(f"Model file not found: {a.model}")
    report = audit(a.model, a.expected_sha)
    a.out.mkdir(parents=True, exist_ok=True)
    (a.out / "p0-glb-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (a.out / "p0-glb-audit.md").write_text(markdown(report), encoding="utf-8")
    print(f"Saved audit to {a.out.resolve()}")
    print(f"Mesh-bearing nodes: {report['nodes_with_mesh']}; primitives: {report['mesh_primitives']}; SHA match: {report['hash_match']}")
    if report["hash_match"] is False:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
