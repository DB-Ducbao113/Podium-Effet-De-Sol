"""Review composite must preserve SHA-verified source, names and neutral color."""
import json
from pathlib import Path
import tempfile
import unittest

from p2_16_rear_wheel_end import build as build_p216
from p2_17_rear_brake_drive import build as build_p217
from p2_17_composite_review import composite


class TestRearCompositeReview(unittest.TestCase):
    def test_all_source_nodes_and_fail_closed_integrity(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            one,two,output=root/'p216',root/'p217',root/'preview'
            build_p216(one)
            build_p217(two)
            report=composite(one,two,output)
            self.assertEqual(report['partCount'],31)
            self.assertFalse(report['modelBIncluded'])
            self.assertFalse(report['mechanicalG2Certified'])
            self.assertEqual(report['unifiedColor'],'#87929d')
            values=[profile['triangles'] for profile in report['profiles'].values()]
            self.assertGreater(values[0],values[1])
            self.assertGreater(values[1],values[2])
            for info in report['profiles'].values():
                self.assertEqual(info['partCount'],31)
            with self.assertRaises(FileExistsError):
                composite(one,two,output)
            profile=json.loads((two/'P217_rear_brake_drive_manifest.json').read_text())['qualityProfiles']['BALANCED']
            binary=two/profile['file']
            binary.write_bytes(binary.read_bytes()+b'tamper')
            with self.assertRaisesRegex(ValueError,'hash mismatch'):
                composite(one,two,root/'corrupt')


if __name__=='__main__':
    unittest.main(verbosity=2)
