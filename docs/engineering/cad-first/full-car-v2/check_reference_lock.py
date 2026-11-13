#!/usr/bin/env python3
"""Checks the engineering reference lock without claiming car geometry exists."""
import json
from pathlib import Path

SOURCE = Path(__file__).with_name("reference-lock.json")
REQUIRED = {"front", "rear", "left", "right", "top", "underside",
            "front-three-quarter", "rear-three-quarter", "cockpit", "front-wing"}
def verify(path: Path = SOURCE):
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["schema"] == "podium-eds.cad-first.reference-lock.v1"
    assert data["generation"] == "2026"
    assert data["status"].startswith("P0_IN_PROGRESS")
    p = data["proposedDesignParameters"]
    assert 0 < p["wheelbaseMm"] <= 3400
    assert 0 < p["bodyHalfWidthMaximumMm"] <= 950
    assert data["coordinates"]["units"] == "mm"
    view_ids = [v["id"] for v in data["views"]]
    assert len(view_ids) == len(set(view_ids))
    assert REQUIRED <= set(view_ids)
    assert data["sourceOfTruth"]["visual"]["licensedForSite"] is False
    assert data["designGate"]["G0"].startswith("HOLD")
    assert data["designGate"]["G1"].startswith("HOLD")
    return {"reference_schema": "PASS", "dimensional_preflight": "PASS",
            "required_view_slots": len(view_ids), "visual_source_assignments": "PENDING",
            "silhouette_accepted": False}
if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
