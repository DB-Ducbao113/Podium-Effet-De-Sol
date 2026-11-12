#!/usr/bin/env python3
"""P2.34AD: locate immutable P2.34E originals by bytes, not filenames.

No native CAD accepted, no model fabrication, no GitHub Actions.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import shutil
import stat
import sys
from pathlib import Path

SCHEMA = 'peds.cad-first.p234ad-original-source-recovery.v1'
PINS = {
    'P234E_source84_revised_six_ball_clearance.step': '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e',
    'P234E_source84_name_index.json': '57afa74054ca892d2cb5633fb1c03a3c906fc2a928adf45f4674aa008952a62a',
    'P234E_source84_ball_contact_audit.json': 'b2eb8da1720cd5bf206e716e24ad8ebdde28d620bf31aaea456edb1b05e4b894',
}

def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def locate(roots, pins=None, max_files=25000, max_file_bytes=500_000_000):
    """Scan finite local directory trees, never traverse symlink dirs/files."""
    pins = PINS if pins is None else dict(pins)
    if not pins or len(set(pins.values())) != len(pins):
        raise ValueError('Three unique file hashes required')
    if not 1 <= max_files <= 1_000_000 or not 1 <= max_file_bytes <= 10_000_000_000:
        raise ValueError('Invalid scan limits')
    roots = [Path(root) for root in roots]
    if not roots:
        raise ValueError('At least one scan directory required')
    matched = {name: [] for name in pins}
    lookup = {digest: name for name, digest in pins.items()}
    scanned = 0
    skipped_large = 0
    skipped_symlinks = 0
    visited = set()
    for root in roots:
        if not root.is_dir() or root.is_symlink():
            raise ValueError('Scan root must be real directory: ' + str(root))
        for folder, directories, files in os.walk(root, followlinks=False):
            directories[:] = sorted(d for d in directories if not (Path(folder) / d).is_symlink())
            for filename in sorted(files):
                source = Path(folder) / filename
                if source.is_symlink():
                    skipped_symlinks += 1
                    continue
                metadata = source.stat()
                if not stat.S_ISREG(metadata.st_mode):
                    continue
                key = (metadata.st_dev, metadata.st_ino)
                if key in visited:
                    continue
                visited.add(key)
                scanned += 1
                if scanned > max_files:
                    raise ValueError('File scan limit exceeded; choose tighter roots')
                if metadata.st_size > max_file_bytes:
                    skipped_large += 1
                    continue
                name = lookup.get(sha(source))
                if name is not None:
                    matched[name].append(str(source.resolve(strict=True)))
    return {'schema': SCHEMA,
            'sourceMatches': matched,
            'allThreeSourceFilesFound': all(matched.values()),
            'scannedRegularFiles': scanned,
            'skippedOversizeFiles': skipped_large,
            'skippedSymlinkFiles': skipped_symlinks,
            'originalCADModified': False,
            'mechanicalG2Certified': False,
            'status': 'SOURCE_BYTES_FOUND_NOT_MECHANICAL_ACCEPTANCE' if all(matched.values()) else 'PINNED_SOURCE_NOT_FOUND_G2_HOLD'}

def stage(report, destination, pins=None):
    """Copy only byte-verified originals to an entirely new native input directory."""
    pins = PINS if pins is None else dict(pins)
    target = Path(destination)
    if target.exists() or target.is_symlink():
        raise FileExistsError('Refuses overwrite or destination symlink')
    matches = report.get('sourceMatches', {})
    if set(matches) != set(pins) or not all(isinstance(matches[k], list) and matches[k] for k in pins):
        raise ValueError('Incomplete original source matches')
    chosen = {}
    for name, digest in pins.items():
        options = sorted(set(matches[name]))
        valid = [p for p in options if Path(p).is_file() and not Path(p).is_symlink() and sha(p) == digest]
        if not valid:
            raise ValueError('Original source changed since scan: ' + name)
        chosen[name] = valid[0]
    target.mkdir(parents=True, exist_ok=False)
    try:
        for name, original in chosen.items():
            shutil.copyfile(original, target / name, follow_symlinks=False)
            if sha(target / name) != pins[name]:
                raise ValueError('Source changed during copy: ' + name)
        output = {'schema': SCHEMA,
                  'stagedFiles': {name: {'sourcePath': chosen[name], 'sha256': pins[name]}
                                  for name in pins},
                  'originalCADModified': False,
                  'nativeSTEPGeometryValidated': False,
                  'mechanicalG2Certified': False,
                  'status': 'ORIGINAL_BYTES_STAGED_FOR_NATIVE_VERIFICATION_G2_HOLD'}
        (target / 'P234AD_source_provenance.json').write_text(json.dumps(output, indent=2) + '\n', encoding='utf-8')
        return output
    except Exception:
        shutil.rmtree(target)
        raise

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--search-root', action='append', required=True, type=Path)
    p.add_argument('--max-files', type=int, default=25000)
    p.add_argument('--max-file-bytes', type=int, default=500_000_000)
    p.add_argument('--report', type=Path, required=True)
    p.add_argument('--stage-dir', type=Path)
    a = p.parse_args()
    if a.report.exists():
        raise FileExistsError('Report already exists')
    result = locate(a.search_root, max_files=a.max_files, max_file_bytes=a.max_file_bytes)
    if a.stage_dir and result['allThreeSourceFilesFound']:
        result['stagedInput'] = stage(result, a.stage_dir)
    a.report.parent.mkdir(parents=True, exist_ok=True)
    a.report.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'found': result['allThreeSourceFilesFound'],
                      'scannedFiles': result['scannedRegularFiles']}))
    return 0 if result['allThreeSourceFilesFound'] else 2

if __name__ == '__main__':
    sys.exit(main())
