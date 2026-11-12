"""Source locator tests using dummy SHA-pinned fixture bytes, NOT source84 CAD."""
from __future__ import annotations
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import p2_34ad_source_locator as x

CONTENT = {'original.step': b'original-step-fixture',
           'index.json': b'original-index-fixture',
           'audit.json': b'original-audit-fixture'}
PINS = {k: hashlib.sha256(v).hexdigest() for k, v in CONTENT.items()}

class SourceRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.src = self.root / 'source'
        self.src.mkdir()

    def make_files(self):
        for i, (name, data) in enumerate(CONTENT.items()):
            directory = self.src / f'bucket_{i}'
            directory.mkdir()
            (directory / ('renamed_' + str(i) + '.dat')).write_bytes(data)

    def test_find_renamed_sources_by_sha(self):
        self.make_files()
        r = x.locate([self.src], PINS)
        self.assertTrue(r['allThreeSourceFilesFound'])
        self.assertEqual(len(r['sourceMatches']), 3)

    def test_missing_file_holds_gate(self):
        self.make_files()
        next((self.src / 'bucket_2').iterdir()).unlink()
        self.assertFalse(x.locate([self.src], PINS)['allThreeSourceFilesFound'])

    def test_changed_file_rejected(self):
        self.make_files()
        candidate = self.src / 'bucket_0' / 'renamed_0.dat'
        candidate.write_bytes(b'changed')
        self.assertFalse(x.locate([self.src], PINS)['allThreeSourceFilesFound'])

    def test_staging_correct_names_and_bytes(self):
        self.make_files()
        result = x.locate([self.src], PINS)
        stage = self.root / 'staged'
        outcome = x.stage(result, stage, PINS)
        self.assertFalse(outcome['mechanicalG2Certified'])
        for name, content in CONTENT.items():
            self.assertEqual((stage / name).read_bytes(), content)
        self.assertTrue((stage / 'P234AD_source_provenance.json').is_file())

    def test_staging_refuses_modified_source(self):
        self.make_files()
        report = x.locate([self.src], PINS)
        (self.src / 'bucket_0' / 'renamed_0.dat').write_bytes(b'altered')
        with self.assertRaisesRegex(ValueError, 'changed'):
            x.stage(report, self.root / 'out', PINS)
        self.assertFalse((self.root / 'out').exists())

    def test_no_stage_overwrite(self):
        self.make_files()
        report = x.locate([self.src], PINS)
        target = self.root / 'out'
        target.mkdir()
        (target / 'protected').write_text('KEEP')
        with self.assertRaises(FileExistsError):
            x.stage(report, target, PINS)
        self.assertEqual((target / 'protected').read_text(), 'KEEP')

    def test_symlink_file_ignored(self):
        self.make_files()
        target = self.src / 'bucket_1' / 'renamed_1.dat'
        proxy = self.src / 'shortcut'
        proxy.symlink_to(target)
        r = x.locate([self.src], PINS)
        self.assertEqual(r['skippedSymlinkFiles'], 1)
        self.assertTrue(r['allThreeSourceFilesFound'])

    def test_symlink_directory_not_walked(self):
        elsewhere = self.root / 'elsewhere'
        elsewhere.mkdir()
        for name, data in CONTENT.items():
            (elsewhere / name).write_bytes(data)
        (self.src / 'link').symlink_to(elsewhere, target_is_directory=True)
        self.assertFalse(x.locate([self.src], PINS)['allThreeSourceFilesFound'])

    def test_root_symlink_rejected(self):
        link = self.root / 'root-link'
        link.symlink_to(self.src, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'real directory'):
            x.locate([link], PINS)

    def test_file_limit_blocks(self):
        self.make_files()
        with self.assertRaisesRegex(ValueError, 'limit'):
            x.locate([self.src], PINS, max_files=1)

    def test_large_files_skipped(self):
        self.make_files()
        r = x.locate([self.src], PINS, max_file_bytes=5)
        self.assertGreater(r['skippedOversizeFiles'], 0)
        self.assertFalse(r['allThreeSourceFilesFound'])

    def test_duplicate_sha_pins_rejected(self):
        with self.assertRaisesRegex(ValueError, 'unique'):
            x.locate([self.src], {'a': 'abc', 'b': 'abc'})

    def test_empty_roots_rejected(self):
        with self.assertRaises(ValueError):
            x.locate([], PINS)

    def test_symlinked_destination_parent_rejected(self):
        self.make_files()
        r = x.locate([self.src], PINS)
        real = self.root / 'real'
        real.mkdir()
        link = self.root / 'linked_parent'
        link.symlink_to(real, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlinked parent'):
            x.stage(r, link / 'new_stage', PINS)
        self.assertFalse((real / 'new_stage').exists())

    def test_midcopy_modified_bytes_rejected_without_partial_stage(self):
        self.make_files()
        r = x.locate([self.src], PINS)
        actual_open = x.os.open
        first = [True]
        def altered_open(path, *args, **kwargs):
            if first[0] and str(path).endswith('renamed_0.dat'):
                first[0] = False
                Path(path).write_bytes(b'MUTATED AFTER SCAN')
            return actual_open(path, *args, **kwargs)
        with patch.object(x.os, 'open', side_effect=altered_open):
            with self.assertRaisesRegex(ValueError, 'bytes changed'):
                x.stage(r, self.root / 'stage_attempt', PINS)
        self.assertFalse((self.root / 'stage_attempt').exists())

    def test_original_path_swap_to_symlink_rejected(self):
        self.make_files()
        r = x.locate([self.src], PINS)
        original = self.src / 'bucket_0' / 'renamed_0.dat'
        other = self.root / 'other.dat'
        other.write_bytes(CONTENT['original.step'])
        actual_open = x.os.open
        swapped = [False]
        def swap_open(path, *args, **kwargs):
            if not swapped[0] and str(path) == str(original):
                swapped[0] = True
                original.unlink()
                original.symlink_to(other)
            return actual_open(path, *args, **kwargs)
        with patch.object(x.os, 'open', side_effect=swap_open):
            with self.assertRaises(OSError):
                x.stage(r, self.root / 'stage_attempt', PINS)
        self.assertFalse((self.root / 'stage_attempt').exists())

    def test_dangerous_canonical_name_rejected(self):
        self.make_files()
        r = x.locate([self.src], PINS)
        evil = {'../bad': next(iter(PINS.values()))}
        with self.assertRaises(ValueError):
            x.stage({'sourceMatches':{'../bad':r['sourceMatches']['original.step']}},
                    self.root / 'stage_attempt', evil)
        self.assertFalse((self.root / 'stage_attempt').exists())

    def test_source_not_modified(self):
        self.make_files()
        before = sorted(p.read_bytes() for p in self.src.rglob('*.dat'))
        r = x.locate([self.src], PINS)
        x.stage(r, self.root / 'output', PINS)
        after = sorted(p.read_bytes() for p in self.src.rglob('*.dat'))
        self.assertEqual(before, after)

if __name__ == '__main__':
    unittest.main(verbosity=2)
