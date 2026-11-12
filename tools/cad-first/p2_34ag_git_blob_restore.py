#!/usr/bin/env python3
"""P2.34AG: recover pinned original P2.34E bytes from local Git objects.

Read original bytes only after an exact SHA-256 match. Never infer a STEP
from its name, an LFS pointer, or a test fixture. Mechanical G2 remains HOLD.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

from p2_34af_git_history_recovery import SOURCE_PINS, git, inspect

SCHEMA = 'peds.cad-first.p234ag-verified-git-blob-restore.v1'
OID = re.compile(r'^[0-9a-f]{40}$|^[0-9a-f]{64}$')


def validate_inventory(inventory, pins):
    """Return selected immutable Git blob IDs; don't trust a cached inventory."""
    if not isinstance(inventory, dict):
        raise ValueError('Git inventory must be a JSON object')
    selections = inventory.get('matches')
    if not isinstance(selections, dict) or set(selections) != set(pins):
        raise ValueError('Inventory original source set is incomplete')
    if inventory.get('schema') != 'peds.cad-first.p234af-git-history-source-recovery.v1':
        raise ValueError('Unsupported Git inventory schema')
    candidates = {}
    for name, expected in pins.items():
        if Path(name).name != name or name in ('.', '..'):
            raise ValueError('Unsafe source target filename')
        found = selections[name]
        if not isinstance(found, list) or not found:
            raise ValueError('Missing genuine Git blob: '+name)
        oid = found[0].get('blobSHA') if isinstance(found[0], dict) else None
        if not isinstance(oid, str) or not OID.fullmatch(oid):
            raise ValueError('Untrusted Git blob ID')
        candidates[name] = oid
    return candidates


def restore(repo, destination, inventory=None, pins=None, max_bytes=500_000_000):
    """Restore a complete, new folder only; verify each Git blob and staged file."""
    repo = Path(repo)
    destination = Path(destination)
    pins = SOURCE_PINS if pins is None else dict(pins)
    if len(pins) != 3 or len(set(pins.values())) != 3:
        raise ValueError('Require three unique SHA-256 pins')
    if type(max_bytes) is not int or not 1024 <= max_bytes <= 2_000_000_000:
        raise ValueError('Invalid object size limit')
    if destination.exists() or destination.is_symlink():
        raise FileExistsError('Refusing existing output or output symlink')
    if any(p.is_symlink() for p in destination.parents):
        raise ValueError('Refusing symlinked output parent')
    if inventory is None:
        inventory = inspect(repo, pins=pins, max_bytes=max_bytes)
    selected = validate_inventory(inventory, pins)
    verified = {}
    # Fetch/rehash all three immutable sources before creating destination.
    for name, oid in selected.items():
        obj_type = git(repo, 'cat-file', '-t', oid).strip()
        if obj_type != b'blob':
            raise ValueError('Expected Git blob')
        size = int(git(repo, 'cat-file', '-s', oid).strip())
        if size == 0 or size > max_bytes:
            raise ValueError('Invalid source blob size')
        data = git(repo, 'cat-file', 'blob', oid)
        if len(data) != size or hashlib.sha256(data).hexdigest() != pins[name]:
            raise ValueError('Exact source SHA mismatch: '+name)
        verified[name] = {'blob': oid, 'bytes': data}
    destination.mkdir(parents=True, exist_ok=False)
    created = []
    try:
        for name, entry in verified.items():
            path = destination / name
            created.append(path)
            with path.open('xb') as output:
                output.write(entry['bytes'])
            if hashlib.sha256(path.read_bytes()).hexdigest() != pins[name]:
                raise ValueError('Staged bytes changed unexpectedly: '+name)
        audit = {'schema': SCHEMA, 'restoredSource': {
                    name: {'gitBlobSHA': entry['blob'],
                           'sourceSHA256': pins[name], 'byteCount': len(entry['bytes'])}
                    for name, entry in verified.items()},
                 'sourceFileCount': 3,
                 'originalSourceModified': False,
                 'nativeGeometryValidated': False,
                 'mechanicalG2Certified': False,
                 'status': 'EXACT_GIT_SOURCE_BYTES_RESTORED_G2_HOLD'}
        manifest = destination / 'P234AG_git_restore_audit.json'
        created.append(manifest)
        with manifest.open('x', encoding='utf-8') as stream:
            stream.write(json.dumps(audit, indent=2, allow_nan=False)+'\n')
        return audit
    except Exception:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        destination.rmdir()
        raise


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--repo', type=Path, required=True)
    p.add_argument('--stage-dir', type=Path, required=True)
    p.add_argument('--inventory', type=Path,
                   help='Optional earlier P2.34AF report; all blob hashes rechecked')
    p.add_argument('--max-bytes', type=int, default=500_000_000)
    a = p.parse_args()
    inventory = json.loads(a.inventory.read_text()) if a.inventory else None
    result = restore(a.repo, a.stage_dir, inventory, max_bytes=a.max_bytes)
    print(json.dumps({'status': result['status'],
                      'sourceFileCount': result['sourceFileCount']}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
