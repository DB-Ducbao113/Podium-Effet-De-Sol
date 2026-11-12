#!/usr/bin/env python3
"""P2.34AC: validate actual persisted M/N bytes before recording stage success.

Metadata-only; source native CAD geometry is not proven by this gate.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

M_SCHEMA = 'peds.cad-first.p234m-cage-orientation-native-grid.v1'
N_SCHEMA = 'peds.cad-first.p234n-original-derived-track-cutter-prototype.v1'
SOURCE_SHA = '9bd7ec6a60d5c4c9f1f3e421cb730fc252de026aae21dcf570584e5dda0ec63e'
STEP_NAME = 'P234N_source84_track_cut_PROTOTYPE.step'
AUDIT_NAME = 'P234N_prototype_native_audit.json'
SHAFT = 'P217_REAR_DRIVE_HALF_SHAFT_UNSPLINED'
CUP = 'P217_REAR_CV_HOUSING_PROTOTYPE'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def persisted_json(path, expected=None):
    path = Path(path)
    if not path.is_file() or path.is_symlink():
        raise ValueError('Evidence is missing or is a symlink: ' + str(path))
    raw = path.read_bytes()
    try:
        data = json.loads(raw)
    except (ValueError, UnicodeDecodeError) as error:
        raise ValueError('Malformed persisted JSON evidence') from error
    if not isinstance(data, dict):
        raise ValueError('Persisted JSON must be an object')
    if expected is not None and data != expected:
        raise ValueError('Returned report differs from persisted report')
    return data, digest(raw)


def check_m(result, m_file, pose_grid_sha):
    from p2_34aa_native_runner import check_m_report
    document, sha = persisted_json(m_file, result)
    reviewed = check_m_report(document, SOURCE_SHA, pose_grid_sha)
    return {'p234mSHA256': sha, 'p234mReview': reviewed}


def check_n(result, n_folder, m_file, source_pins):
    if not isinstance(result, dict):
        raise ValueError('N returned audit is not an object')
    n_folder = Path(n_folder)
    step = n_folder / STEP_NAME
    if not step.is_file() or step.is_symlink() or step.stat().st_size == 0:
        raise ValueError('P2.34N candidate STEP missing, symlink, or empty')
    step_sha = digest(step.read_bytes())
    audit, audit_sha = persisted_json(n_folder / AUDIT_NAME, result)
    expected_pins = dict(source_pins)
    if audit.get('schema') != N_SCHEMA:
        raise ValueError('P2.34N schema mismatch')
    if audit.get('nativeSourceSHA256') != expected_pins or expected_pins.get(
            'P234E_source84_revised_six_ball_clearance.step') != SOURCE_SHA:
        raise ValueError('P2.34N original 84 source hashes do not match')
    if audit.get('parentP234MReportSHA256') != digest(Path(m_file).read_bytes()):
        raise ValueError('P2.34N parent report does not match actual M bytes')
    if audit.get('outputCandidateSHA256') != step_sha:
        raise ValueError('P2.34N candidate STEP SHA does not match bytes')
    if audit.get('sourcePartCount') != 84 or audit.get('changedParts') != [SHAFT, CUP]:
        raise ValueError('P2.34N changed-part scope invalid')
    for key in ('original84Retained', 'sourceGeometryUnchanged',
                'cutterIsDiscreteSphereUnionNotMachinedSmoothGroove'):
        if audit.get(key) is not True:
            raise ValueError('P2.34N safety evidence missing: ' + key)
    for key in ('mechanicalG2Certified', 'constantVelocityCertified',
                'loadedTorqueCertified', 'postCutNativeCollisionScreenCompleted'):
        if audit.get(key) is not False:
            raise ValueError('P2.34N unsupported mechanical certificate: ' + key)
    return {'p234nCandidateSHA256': step_sha, 'p234nAuditSHA256': audit_sha}
